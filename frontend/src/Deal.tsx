import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { useApp } from "./context";
import { date, money, STAGES } from "./lib";
import {
  AiMark,
  Avatar,
  Button,
  CompanyLogo,
  Empty,
  Panel,
  StageBadge,
} from "./components/ui";
import { useStageChange } from "./Pipeline";
import { TaskRow } from "./Work";

export function DealPage() {
  const { id } = useParams(),
    [params] = useSearchParams();
  const { data, openModal, openAI } = useApp(),
    [tab, setTab] = useState("Activity");
  const { changeStage, pending } = useStageChange();
  const d = data.deals.find((d) => d.id === id);
  if (!d)
    return (
      <Empty title="This opportunity isn't available.">
        <Link to="/pipeline">Back to pipeline</Link>
      </Empty>
    );
  const account = data.accounts.find((a) => a.id === d.accountId)!,
    contact = data.contacts.find((c) => c.id === d.contactId),
    owner = data.members.find((m) => m.id === d.ownerId);
  const insight = data.insights.find((i) => i.dealId === d.id),
    activities = data.activities.filter((a) => a.dealId === d.id),
    tasks = data.tasks.filter((t) => t.dealId === d.id);
  const stagePath = d.stage === "Lost" ? [...STAGES.slice(0, 4), "Lost"] : STAGES.slice(0, 5);
  const currentStage = stagePath.indexOf(d.stage);
  const activityIcons: Record<string, typeof Mail> = {
    email: Mail,
    meeting: Users,
    call: Phone,
    note: FileText,
    task: Check,
    stage: ArrowRight,
  };
  return (
    <>
      <Link className="back-link" to={`/pipeline?${params}`}>
        <ArrowLeft size={15} />
        Back to pipeline
      </Link>
      <div className="record-heading">
        <CompanyLogo account={account} size="lg" />
        <div>
          <Link
            className="eyebrow record-account-link"
            to={`/accounts/${account.id}`}
          >
            {account.name}
            <ArrowUpRight size={11} />
          </Link>
          <h1>{d.name.split(" — ")[1] || d.name}</h1>
          <p>Great potential. Let's keep it moving.</p>
        </div>
        <Button onClick={() => openModal({ type: "deal", id: d.id })}>
          <Pencil size={15} />
          Edit deal
        </Button>
        <Button
          variant="primary"
          onClick={() => openAI({ action: "draft", dealId: d.id })}
        >
          <Sparkles size={16} />
          Draft a follow-up
        </Button>
      </div>
      <div className="deal-stage-track" aria-label="Opportunity stage">
        {stagePath.map((s, i) => (
          <button
            key={s}
            disabled={!!pending}
            className={`${i < currentStage ? "done" : ""} ${i === currentStage ? "current" : ""}`}
            onClick={() => void changeStage(d, s)}
          >
            <span>{i < currentStage ? <Check size={12} /> : i + 1}</span>
            {s}
            <ChevronRight size={15} />
          </button>
        ))}
      </div>
      <div className="deal-layout">
        <div className="deal-main">
          <div className="deal-key-facts">
            <button onClick={() => openModal({ type: "deal", id: d.id })}>
              <span>OPPORTUNITY VALUE</span>
              <strong>{money(d.amountCents)}</strong>
              <small>USD · deal value</small>
            </button>
            <button onClick={() => openModal({ type: "deal", id: d.id })}>
              <span>TARGET CLOSE</span>
              <strong>{date(d.closeDate)}</strong>
              <small>{date(d.closeDate, { year: "numeric" })}</small>
            </button>
            <button onClick={() => openModal({ type: "deal", id: d.id })}>
              <span>DEAL OWNER</span>
              <strong className="deal-owner">
                <Avatar person={owner} size="xs" />
                {owner?.name.split(" ")[0]}
              </strong>
              <small>{owner?.role}</small>
            </button>
            <label className="stage-fact">
              <span>PIPELINE STAGE</span>
              <StageBadge stage={d.stage} />
              <select
                aria-label="Change deal stage"
                value={d.stage}
                disabled={!!pending}
                onChange={(e) => void changeStage(d, e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          {insight && (
            <div
              className={`deal-insight ${insight.score >= 60 ? "needs-attention" : ""}`}
            >
              <AiMark />
              <div>
                <span className="briefing-kicker">JUNO NOTICED SOMETHING</span>
                <h2>
                  {insight.score >= 60
                    ? "A little attention could make a difference."
                    : "Keep the next conversation in sight."}
                </h2>
                <p>{insight.summary}.</p>
              </div>
              <button
                aria-label="Explain deal insight"
                onClick={() => openAI({ action: "risk", dealId: d.id })}
              >
                <ArrowUpRight size={20} />
              </button>
            </div>
          )}
          <Panel
            title="Keep the conversation moving"
            action={
              <Button
                variant="ghost"
                onClick={() =>
                  openModal({
                    type: "activity",
                    dealId: d.id,
                    accountId: d.accountId,
                  })
                }
              >
                <Plus size={15} />
                Log activity
              </Button>
            }
          >
            <div className="record-tabs tabs">
              {["Activity", "Notes", "Tasks"].map((t) => (
                <button
                  key={t}
                  className={tab === t ? "active" : ""}
                  onClick={() => setTab(t)}
                >
                  {t}
                  {t === "Tasks" && (
                    <span>{tasks.filter((t) => !t.completed).length}</span>
                  )}
                </button>
              ))}
            </div>
            {tab === "Tasks" ? (
              <div className="deal-task-list">
                {tasks.map((t) => (
                  <TaskRow key={t.id} task={t} compact />
                ))}
                {!tasks.length && (
                  <Empty
                    title="What's the next good step?"
                    action={
                      <Button
                        onClick={() =>
                          openModal({
                            type: "task",
                            dealId: d.id,
                            accountId: d.accountId,
                          })
                        }
                      >
                        <Plus size={15} />
                        Add a next step
                      </Button>
                    }
                  >
                    A clear next step helps everyone move forward.
                  </Empty>
                )}
              </div>
            ) : (
              <div className="timeline">
                {activities
                  .filter((a) => tab !== "Notes" || a.kind === "note")
                  .map((a) => {
                    const Icon = activityIcons[a.kind] || MessageSquare;
                    return (
                      <div
                        className={`timeline-entry kind-${a.kind}`}
                        key={a.id}
                      >
                        <span className="timeline-icon">
                          <Icon size={16} />
                        </span>
                        <div className="timeline-content">
                          <div className="timeline-entry-heading">
                            <strong>{a.title}</strong>
                            <time>{date(a.happenedAt)}</time>
                          </div>
                          <p>{a.body}</p>
                          <span className="timeline-byline">
                            <Avatar
                              person={data.members.find(
                                (m) => m.id === a.ownerId,
                              )}
                              size="xs"
                            />
                            {data.members.find((m) => m.id === a.ownerId)?.name}
                            <span>·</span>
                            {date(a.happenedAt, {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {!activities.filter((a) => tab !== "Notes" || a.kind === "note")
                  .length && (
                  <Empty title="Room for a little context.">
                    Add a note from your next conversation.
                  </Empty>
                )}
              </div>
            )}
          </Panel>
        </div>
        <aside className="deal-sidebar">
          <Panel
            title="Your next step"
            subtitle="A little follow-through goes a long way"
            action={
              <button
                className="small-plus"
                aria-label="Add next step"
                onClick={() =>
                  openModal({
                    type: "task",
                    dealId: d.id,
                    accountId: d.accountId,
                  })
                }
              >
                <Plus size={17} />
              </button>
            }
          >
            {tasks.some((t) => !t.completed) ? (
              <div className="deal-next-tasks">
                {tasks
                  .filter((t) => !t.completed)
                  .map((t) => (
                    <TaskRow key={t.id} task={t} compact />
                  ))}
              </div>
            ) : (
              <div className="next-step-empty">
                <span>
                  <CalendarDays size={21} />
                </span>
                <h3>Let's put a plan in place.</h3>
                <p>Give this opportunity a clear next move.</p>
                <Button
                  onClick={() =>
                    openModal({
                      type: "task",
                      dealId: d.id,
                      accountId: d.accountId,
                    })
                  }
                >
                  <Plus size={15} />
                  Schedule a follow-up
                </Button>
              </div>
            )}
          </Panel>
          <Panel title="Your person at the table">
            {contact ? (
              <div className="deal-contact">
                <Avatar person={contact} size="lg" />
                <strong>{contact.name}</strong>
                <span>{contact.jobTitle}</span>
                <span className="deal-contact-email">{contact.email}</span>
                <Button
                  onClick={() => openModal({ type: "contact", id: contact.id })}
                >
                  View contact
                  <ArrowUpRight size={14} />
                </Button>
              </div>
            ) : (
              <Empty title="Add a little human context.">
                Choose a contact when editing this deal.
              </Empty>
            )}
            <Link
              className="deal-account-footer"
              to={`/accounts/${account.id}`}
            >
              <CompanyLogo account={account} />
              <span>
                {account.name}
                <small>{account.industry}</small>
              </span>
              <ArrowUpRight size={15} />
            </Link>
          </Panel>
          {insight && (
            <div className="evidence-card">
              <span className="eyebrow">THE FACTS BEHIND THE INSIGHT</span>
              {insight.evidence.map((e, i) => (
                <div key={i}>
                  <Clock3 size={14} />
                  <span>
                    <strong>{e.label}</strong>
                    {e.detail}
                  </span>
                </div>
              ))}
              <p>
                Based on recorded activity and open tasks.
                <br />
                Updated when your CRM changes.
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
