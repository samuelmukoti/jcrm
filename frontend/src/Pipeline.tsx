import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Columns3,
  GripVertical,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useApp } from "./context";
import {
  filteredDeals,
  money,
  openDeal,
  STAGES,
  STAGE_COLORS,
  write,
} from "./lib";
import {
  Avatar,
  Button,
  CompanyLogo,
  Empty,
  StageBadge,
} from "./components/ui";
import { DealRows, PageHeading, WorkspaceFilters } from "./Dashboard";
import type { Deal } from "./types";

export function useStageChange() {
  const { refresh, notify } = useApp();
  const [pending, setPending] = useState<string | null>(null);
  async function changeStage(deal: Deal, stage: string) {
    if (deal.stage === stage || pending) return;
    setPending(deal.id);
    try {
      await write(
        `/deals/${deal.id}/stage`,
        { stage, version: deal.version },
        "PATCH",
      );
      await refresh();
      notify(`Moved to ${stage}.`, {
        label: "Undo",
        run: async () => {
          try {
            await write(
              `/deals/${deal.id}/stage`,
              {
                stage: deal.stage,
                version: deal.version + 1,
                restoreCloseDate: deal.actualCloseDate,
              },
              "PATCH",
            );
            await refresh();
            notify("Stage move undone.");
          } catch (e) {
            notify((e as Error).message);
            await refresh();
          }
        },
      });
    } catch (e) {
      notify((e as Error).message);
      await refresh();
    } finally {
      setPending(null);
    }
  }
  return { pending, changeStage };
}
export function PipelinePage() {
  const { data, period, owner, openModal } = useApp(),
    navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState("board"),
    [dragOver, setDragOver] = useState<string | null>(null);
  const { pending, changeStage } = useStageChange();
  const status = params.get("status") || "Open",
    stage = params.get("stage") || "all",
    search = params.get("q") || "",
    attention = params.get("attention") === "true";
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  const deals = filteredDeals(data, period, owner)
    .filter((d) =>
      status === "Open"
        ? openDeal(d)
        : status === "Closed"
          ? !openDeal(d)
          : status === "All"
            ? true
            : d.stage === status,
    )
    .filter((d) => stage === "all" || d.stage === stage)
    .filter(
      (d) =>
        !attention ||
        data.insights.some((i) => i.dealId === d.id && i.score >= 60),
    )
    .filter((d) =>
      `${d.name} ${data.accounts.find((a) => a.id === d.accountId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  const stages =
    stage !== "all"
      ? [stage]
      : status === "Open"
        ? STAGES.slice(0, 4)
        : status === "Closed"
          ? STAGES.slice(4)
          : ["Won", "Lost"].includes(status)
            ? [status]
            : STAGES;
  return (
    <>
      <PageHeading
        eyebrow="GOOD RELATIONSHIPS. REAL POTENTIAL."
        title="Keep good things moving."
        description="A clearer path from first conversation to your next big win."
      >
        <Button variant="primary" onClick={() => openModal({ type: "deal" })}>
          <Plus size={17} />
          New deal
        </Button>
      </PageHeading>
      <div className="pipeline-overview">
        <div>
          <span className="section-kicker">YOUR ACTIVE VIEW</span>
          <strong>
            {money(
              deals.reduce((n, d) => n + d.amountCents, 0),
              true,
            )}
            <small>{deals.length} opportunities</small>
          </strong>
        </div>
        <div className="pipeline-stage-legend">
          {data.dashboard.stages.map((s) => (
            <span key={s.stage}>
              <i style={{ background: STAGE_COLORS[s.stage] }} />
              {s.stage}
              <strong>{s.count}</strong>
            </span>
          ))}
        </div>
        <WorkspaceFilters />
      </div>
      <div className="pipeline-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Search opportunities"
            placeholder="Find an opportunity..."
            value={search}
            onChange={(e) => filter("q", e.target.value)}
          />
        </div>
        <div className="pipeline-controls">
          <label className="filter-select">
            <SlidersHorizontal size={15} />
            <select
              aria-label="Opportunity status"
              value={status}
              onChange={(e) => filter("status", e.target.value)}
            >
              {["Open", "Won", "Lost", "Closed", "All"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>
          <label className="filter-select stage-filter">
            <select
              aria-label="Pipeline stage"
              value={stage}
              onChange={(e) => filter("stage", e.target.value)}
            >
              <option value="all">All stages</option>
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>
          <div className="view-toggle">
            <button
              aria-label="Board view"
              aria-pressed={view === "board"}
              className={view === "board" ? "active" : ""}
              onClick={() => setView("board")}
            >
              <Columns3 size={17} />
            </button>
            <button
              aria-label="Table view"
              aria-pressed={view === "table"}
              className={view === "table" ? "active" : ""}
              onClick={() => setView("table")}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>
      {attention && (
        <div className="active-filter">
          Needs attention{" "}
          <button
            aria-label="Clear attention filter"
            onClick={() => filter("attention", "")}
          >
            <X size={13} />
          </button>
        </div>
      )}
      {view === "table" ? (
        <div className="panel">
          <DealRows deals={deals} />
        </div>
      ) : (
        <>
          <div className="pipeline-board">
            {stages.map((s) => {
              const items = deals.filter((d) => d.stage === s);
              return (
                <section
                  key={s}
                  className={`board-column ${dragOver === s ? "drag-over" : ""}`}
                  aria-label={`${s} stage`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(s);
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    const d = data.deals.find(
                      (x) => x.id === e.dataTransfer.getData("text/plain"),
                    );
                    if (d) void changeStage(d, s);
                  }}
                >
                  <div className="board-column-heading">
                    <span>
                      <i style={{ background: STAGE_COLORS[s] }} />
                      {s}
                      <small>{items.length}</small>
                    </span>
                    <button
                      aria-label={`Add deal to ${s}`}
                      onClick={() => openModal({ type: "deal", title: s })}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="board-column-total">
                    {money(items.reduce((n, d) => n + d.amountCents, 0))}
                  </div>
                  <div className="board-cards">
                    {items.map((d) => (
                      <div
                        key={d.id}
                        className={`opportunity-card ${pending === d.id ? "saving" : ""}`}
                        draggable={!pending}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", d.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <button
                          className="card-main"
                          onClick={() =>
                            navigate(
                              `/deals/${d.id}?period=${period}&owner=${owner}`,
                            )
                          }
                        >
                          <span className="card-company">
                            <CompanyLogo
                              account={data.accounts.find(
                                (a) => a.id === d.accountId,
                              )}
                            />
                            <span>
                              {
                                data.accounts.find((a) => a.id === d.accountId)
                                  ?.name
                              }
                            </span>
                            <ArrowUpRight size={14} />
                          </span>
                          <h3>{d.name.split(" — ")[1] || d.name}</h3>
                          <strong>{money(d.amountCents)}</strong>
                        </button>
                        {data.insights.some(
                          (i) => i.dealId === d.id && i.score >= 60,
                        ) && (
                          <span className="attention-badge">
                            <i />
                            Needs attention
                          </span>
                        )}
                        <div className="opportunity-card-footer">
                          <Avatar
                            person={data.members.find(
                              (m) => m.id === d.ownerId,
                            )}
                            size="xs"
                          />
                          <span>
                            {new Date(
                              d.closeDate + "T12:00Z",
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              timeZone: "UTC",
                            })}
                          </span>
                          <GripVertical size={14} />
                        </div>
                        <label className="card-stage-menu">
                          <select
                            aria-label={`Move ${d.name} to stage`}
                            value={d.stage}
                            disabled={!!pending}
                            onChange={(e) =>
                              void changeStage(d, e.target.value)
                            }
                          >
                            {STAGES.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} />
                        </label>
                      </div>
                    ))}
                    {!items.length && (
                      <div className="empty-column">
                        <Check size={20} />
                        <span>A little room for possibility.</span>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
          <div className="pipeline-mobile">
            {deals.map((d) => (
              <div className="mobile-deal-card" key={d.id}>
                <button onClick={() => navigate(`/deals/${d.id}`)}>
                  <CompanyLogo
                    account={data.accounts.find((a) => a.id === d.accountId)}
                  />
                  <span>
                    <strong>{d.name}</strong>
                    <small>{money(d.amountCents)}</small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
                <label>
                  <StageBadge stage={d.stage} />
                  <select
                    aria-label={`Move ${d.name} to stage`}
                    value={d.stage}
                    disabled={!!pending}
                    onChange={(e) => void changeStage(d, e.target.value)}
                  >
                    {STAGES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>
            ))}
          </div>
        </>
      )}
      {!deals.length && (
        <Empty title="A little space for the next big thing." search>
          Try another filter, or create an opportunity.
        </Empty>
      )}
    </>
  );
}
