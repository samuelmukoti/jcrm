import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Flag,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useApp } from "./context";
import { date, filteredDeals, money, openDeal, STAGE_COLORS } from "./lib";
import {
  AiMark,
  Avatar,
  Button,
  CompanyLogo,
  Empty,
  Panel,
  StageBadge,
  TextLink,
} from "./components/ui";
import { TaskRow } from "./Work";
import type { Deal } from "./types";

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-heading-actions">{children}</div>
    </div>
  );
}
export function WorkspaceFilters() {
  const { data, period, owner, setFilters } = useApp();
  return (
    <div className="workspace-filters">
      <label className="filter-select">
        {owner === "all" ? (
          <Users size={14} />
        ) : (
          <Avatar person={data.members.find((m) => m.id === owner)} size="xs" />
        )}
        <select
          aria-label="Filter by owner"
          value={owner}
          onChange={(e) => setFilters(period, e.target.value)}
        >
          <option value="all">All owners</option>
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <ChevronDown size={13} />
      </label>
      <label className="filter-select">
        <CalendarDays size={15} />
        <select
          aria-label="Reporting period"
          value={period}
          onChange={(e) => setFilters(e.target.value, owner)}
        >
          <option value="quarter">This quarter</option>
          <option value="month">This month</option>
          <option value="all">All time</option>
        </select>
        <ChevronDown size={13} />
      </label>
    </div>
  );
}
export function DealRows({
  deals,
  compact = false,
}: {
  deals: Deal[];
  compact?: boolean;
}) {
  const { data, period, owner } = useApp();
  if (!deals.length)
    return (
      <Empty title="A clear view ahead">
        No opportunities match this view. Try another filter.
      </Empty>
    );
  return (
    <div className={`deal-table ${compact ? "compact" : ""}`}>
      <div className="deal-table-head">
        <span>OPPORTUNITY</span>
        <span>VALUE</span>
        <span>STAGE</span>
        {!compact && <span>CLOSE DATE</span>}
        <span />
      </div>
      {deals.map((d) => {
        const a = data.accounts.find((a) => a.id === d.accountId);
        return (
          <Link
            className="deal-table-row"
            key={d.id}
            to={`/deals/${d.id}?period=${period}&owner=${owner}`}
          >
            <span className="deal-cell">
              <CompanyLogo account={a} />
              <span>
                <strong>{a?.name}</strong>
                <small>{d.name.split(" — ")[1] || d.name}</small>
              </span>
            </span>
            <strong className="deal-value">{money(d.amountCents)}</strong>
            <StageBadge stage={d.stage} />
            {!compact && (
              <span className="deal-close">{date(d.closeDate)}</span>
            )}
            <ArrowUpRight size={16} className="row-arrow" />
          </Link>
        );
      })}
    </div>
  );
}
export function DashboardPage() {
  const { data, period, owner, openModal, openAI } = useApp(),
    navigate = useNavigate();
  const m = data.dashboard;
  const deals = filteredDeals(data, period, owner);
  const priorities = data.insights.filter(
    (i) => deals.some((d) => d.id === i.dealId) && i.score >= 60,
  );
  const primary =
    data.deals.find((d) => d.id === priorities[0]?.dealId) ||
    deals.find(openDeal);
  const account = data.accounts.find((a) => a.id === primary?.accountId);
  const tasks = data.tasks.filter(
    (t) => !t.completed && (owner === "all" || t.ownerId === owner),
  );
  const dueCount = tasks.filter(
    (t) => t.dueDate <= data.workspace.today,
  ).length;
  const scope = `period=${period}&owner=${owner}`;
  const greeting =
    new Date().getUTCHours() < 12
      ? "Good morning"
      : new Date().getUTCHours() < 18
        ? "Good afternoon"
        : "Good evening";
  const metricCards = [
    {
      label: "Open pipeline",
      value: money(m.openPipelineCents, true),
      note: `${m.openCount} opportunities in motion`,
      icon: CircleDollarSign,
      color: "purple",
      status: "Open",
    },
    {
      label: "Weighted forecast",
      value: money(m.weightedForecastCents, true),
      note: "Open value × stage probability",
      icon: TrendingUp,
      color: "blue",
      status: "Open",
    },
    {
      label: "Won value",
      value: money(m.wonValueCents, true),
      note: `${m.wonCount} deals worth celebrating`,
      icon: Flag,
      color: "green",
      status: "Won",
    },
    {
      label: "Win rate",
      value: m.winRate === null ? "—" : `${Math.round(m.winRate * 100)}%`,
      note: `${m.wonCount} won · ${m.lostCount} lost this period`,
      icon: Target,
      color: "orange",
      status: "Closed",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE CLARITY. A LOT OF MOMENTUM."
        title={`${greeting}, Alex.`}
        description="Here's what's moving your business forward."
      >
        <Button
          onClick={() => openModal({ type: "tour" })}
          className="tour-button"
        >
          <span className="play-circle">▶</span>Quick tour
        </Button>
        <Button variant="primary" onClick={() => openModal({ type: "deal" })}>
          <Plus size={17} />
          New deal
        </Button>
      </PageHeading>
      <div className="overview-toolbar">
        <span className="section-kicker">
          Your business at a glance{" "}
          <span className="live-label">
            <i />
            Live
          </span>
        </span>
        <WorkspaceFilters />
      </div>
      <section className="briefing-banner">
        <div className="briefing-icon">
          <Sparkles size={24} strokeWidth={1.5} />
        </div>
        <div className="briefing-copy">
          <div className="briefing-kicker">
            A LITTLE INSIGHT FROM JUNO <span>AI</span>
          </div>
          <h2>
            {priorities.length
              ? `${priorities.length} ${priorities.length === 1 ? "opportunity" : "opportunities"} could use your personal touch.`
              : "Good momentum starts with a clear next step."}
          </h2>
          <p>
            {primary ? (
              <>
                {account?.name}'s {money(primary.amountCents)} opportunity is
                worth a closer look. A thoughtful follow-up can keep things
                moving.
              </>
            ) : (
              "Your workspace is ready for its next opportunity. Add a deal to get started."
            )}
          </p>
        </div>
        <Button
          className="briefing-action"
          onClick={() =>
            primary
              ? navigate(`/deals/${primary.id}?${scope}`)
              : openAI({ action: "briefing" })
          }
        >
          {primary ? "See the opportunity" : "Get my briefing"}
          <ArrowRight size={16} />
        </Button>
        <div className="briefing-decoration" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </section>
      <div className="metrics-grid">
        {metricCards.map((c) => (
          <button
            key={c.label}
            className="metric-card"
            onClick={() => navigate(`/pipeline?${scope}&status=${c.status}`)}
          >
            <div className="metric-top">
              <span>{c.label}</span>
              <span className={`metric-icon ${c.color}`}>
                <c.icon size={17} strokeWidth={1.7} />
              </span>
            </div>
            <div className="metric-value">
              {c.value}
              <ArrowUpRight size={17} />
            </div>
            <div className="metric-note">
              <span className={`metric-note-dot ${c.color}`} />
              {c.note}
            </div>
          </button>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel
          title="A view of your momentum"
          subtitle="Closed-won value, over the last six months"
          className="momentum-panel"
          action={
            <span className="chart-period">
              <span className="legend-dot" />
              Won value
            </span>
          }
        >
          <div className="chart-summary">
            <strong>
              {money(
                m.trend.reduce((n, p) => n + p.amountCents, 0),
                true,
              )}
            </strong>
            <span>in meaningful partnerships</span>
            <span className="chart-unit">USD</span>
          </div>
          <RevenueChart />
          <div className="chart-caption">
            <span>
              <span className="status-dot" />
              Every win starts with a relationship.
            </span>
            <span>
              {owner === "all"
                ? "All owners"
                : data.members.find((x) => x.id === owner)?.name}
            </span>
          </div>
        </Panel>
        <Panel
          title="Your pipeline, in focus"
          subtitle={`${m.openCount} open opportunities`}
          className="pipeline-summary"
          action={
            <TextLink onClick={() => navigate(`/pipeline?${scope}`)}>
              View all
            </TextLink>
          }
        >
          <div className="pipeline-total">
            <strong>{money(m.openPipelineCents, true)}</strong>
            <span>total pipeline</span>
          </div>
          <div className="pipeline-stacked" aria-label="Pipeline distribution">
            {m.stages.map((s) => (
              <span
                key={s.stage}
                title={`${s.stage}: ${money(s.amountCents)}`}
                style={{
                  background: STAGE_COLORS[s.stage],
                  flex: Math.max(s.amountCents, 1),
                }}
              />
            ))}
          </div>
          <div className="stage-summary-list">
            {m.stages.map((s) => (
              <button
                key={s.stage}
                onClick={() => navigate(`/pipeline?${scope}&stage=${s.stage}`)}
              >
                <span className="stage-summary-name">
                  <i style={{ background: STAGE_COLORS[s.stage] }} />
                  {s.stage}
                  <small>{s.count}</small>
                </span>
                <strong>{money(s.amountCents, true)}</strong>
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>
          <div className="pipeline-summary-foot">
            <TrendingUp size={14} />
            <details className="forecast-explainer">
              <summary>How the forecast works</summary>
              <p>
                Open deal value × stage weight, summed for your selected owner
                and period.
              </p>
              <p>
                {m.stages
                  .map((s) => `${s.stage} ${s.probability}%`)
                  .join(" · ")}
              </p>
              <p>
                Stage weights are demo assumptions, rather than AI predictions.
              </p>
            </details>
          </div>
        </Panel>
        <Panel
          title="A few deals that need you"
          subtitle="The right attention, at the right moment"
          className="priority-panel"
          action={
            <TextLink
              onClick={() => navigate(`/pipeline?${scope}&attention=true`)}
            >
              All opportunities
            </TextLink>
          }
        >
          <DealRows
            deals={priorities
              .slice(0, 4)
              .map((i) => data.deals.find((d) => d.id === i.dealId)!)}
          />
          <div className="panel-bottom-note">
            <AiMark small />
            <span>
              Prioritized by close date, buyer activity, and next steps.
            </span>
          </div>
        </Panel>
        <Panel
          title="Your next moves"
          subtitle={`${dueCount} due today or overdue · you've got this`}
          className="focus-panel"
          action={
            <button
              className="small-plus"
              aria-label="Add a task"
              onClick={() => openModal({ type: "task" })}
            >
              <Plus size={17} />
            </button>
          }
        >
          <div className="focus-tasks">
            {tasks.slice(0, 4).map((t) => (
              <TaskRow key={t.id} task={t} compact />
            ))}
            {!tasks.length && (
              <Empty title="Room to focus">You're all caught up.</Empty>
            )}
          </div>
          <Link className="all-tasks-link" to={`/work?${scope}`}>
            See all your work
            <ArrowRight size={15} />
          </Link>
        </Panel>
      </div>
      <div className="relationship-strip">
        <div className="strip-icon">
          <ArrowDownRight size={19} />
        </div>
        <p>
          Good relationships are good business.
          <span>You've got the people. We'll help with the possibilities.</span>
        </p>
        <Button variant="ghost" onClick={() => navigate("/relationships")}>
          Explore your relationships
          <ArrowRight size={15} />
        </Button>
      </div>
    </>
  );
}
function RevenueChart() {
  const { data } = useApp();
  const points = data.dashboard.trend,
    max = Math.max(...points.map((p) => p.amountCents), 10000) * 1.25;
  const width = 600,
    height = 170,
    left = 47,
    right = 14,
    bottom = 24,
    top = 9;
  const coords = points.map((p, i) => ({
    x: left + (i * (width - left - right)) / 5,
    y: top + (1 - p.amountCents / max) * (height - top - bottom),
  }));
  const path = coords
    .map((p, i) =>
      i === 0
        ? `M ${p.x},${p.y}`
        : `C ${(coords[i - 1].x + p.x) / 2},${coords[i - 1].y} ${(coords[i - 1].x + p.x) / 2},${p.y} ${p.x},${p.y}`,
    )
    .join(" ");
  return (
    <div className="revenue-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Won value by month. ${points.map((p) => `${p.label}: ${money(p.amountCents)}`).join(". ")}`}
      >
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8c80e5" stopOpacity=".22" />
            <stop offset="100%" stopColor="#8c80e5" stopOpacity=".015" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const y = top + (i * (height - top - bottom)) / 3;
          return (
            <g key={i}>
              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                stroke="#ebeef3"
                strokeDasharray="3 5"
              />
              <text x={left - 10} y={y + 4} textAnchor="end">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  notation: "compact",
                  maximumFractionDigits: 0,
                }).format((max * (1 - i / 3)) / 100)}
              </text>
            </g>
          );
        })}
        <path
          d={`${path} L ${coords[5].x},${height - bottom} L ${coords[0].x},${height - bottom} Z`}
          fill="url(#chartFill)"
        />
        <path
          d={path}
          stroke="#8a7cdb"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {coords.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="3.7"
              fill="white"
              stroke="#8a7cdb"
              strokeWidth="2"
            >
              <title>
                {points[i].label}: {money(points[i].amountCents)}
              </title>
            </circle>
            <text x={p.x} y={height - 3} textAnchor="middle">
              {points[i].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
