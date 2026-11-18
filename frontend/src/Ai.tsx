import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  Copy,
  FileText,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useApp } from "./context";
import { date, money, write } from "./lib";
import { AiMark, Button, CompanyLogo, IconButton } from "./components/ui";
import type { AiResult, AiState } from "./types";

const questions = [
  "Which deals need attention?",
  "What is closing this month?",
  "Show Alex's pipeline",
  "What work is due this week?",
];
export function AiView({
  initial,
  onNavigate,
}: {
  initial?: AiState;
  onNavigate?: () => void;
}) {
  const { data, openModal, notify, refresh } = useApp(),
    [params] = useSearchParams();
  const [request, setRequest] = useState<AiState>(
    () =>
      initial || {
        action: (params.get("action") as AiState["action"]) || "briefing",
        dealId: params.get("deal") || undefined,
      },
  );
  const [question, setQuestion] = useState(""),
    [result, setResult] = useState<AiResult | null>(null),
    [draft, setDraft] = useState(""),
    [showEvidence, setShowEvidence] = useState(false),
    [copied, setCopied] = useState(false),
    [generatingKey, setGeneratingKey] = useState(""),
    [saving, setSaving] = useState(false);
  const started = useRef(false),
    draftRef = useRef("");
  const deal = data.deals.find((d) => d.id === request.dealId),
    account = data.accounts.find((a) => a.id === deal?.accountId);
  const contextKey = request.dealId
    ? JSON.stringify({
        version: deal?.version,
        tasks: data.tasks.filter((t) => t.dealId === request.dealId),
        activities: data.activities.filter(
          (a) => a.dealId === request.dealId && a.title !== "Follow-up draft",
        ),
      })
    : JSON.stringify({
        deals: data.deals.map((d) => [d.id, d.version]),
        tasks: data.tasks.map((t) => [t.id, t.version]),
      });
  const stale = !!result && generatingKey !== contextKey;
  const mutation = useMutation({
    mutationFn: (state: AiState) => write<AiResult>("/ai", state),
    onSuccess: (value) => {
      setResult(value);
      setDraft(value.draft || "");
      draftRef.current = value.draft || "";
      setShowEvidence(false);
    },
    onError: (e) => notify(e.message),
  });
  function generate(next: AiState) {
    setRequest(next);
    const nextDeal = data.deals.find((d) => d.id === next.dealId);
    setGeneratingKey(
      next.dealId
        ? JSON.stringify({
            version: nextDeal?.version,
            tasks: data.tasks.filter((t) => t.dealId === next.dealId),
            activities: data.activities.filter(
              (a) => a.dealId === next.dealId && a.title !== "Follow-up draft",
            ),
          })
        : JSON.stringify({
            deals: data.deals.map((d) => [d.id, d.version]),
            tasks: data.tasks.map((t) => [t.id, t.version]),
          }),
    );
    mutation.mutate(next);
  }
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      generate(request);
    }
  }, []); // The initial action runs once; subsequent requests are deliberate user actions.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (draft !== draftRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draft]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      notify("Draft copied. Ready for your personal touch.");
    } catch {
      notify("Select the draft text and use your device’s Copy action.");
    }
  }
  async function saveNote() {
    if (!deal || stale) return;
    setSaving(true);
    try {
      await write("/activities", {
        dealId: deal.id,
        accountId: deal.accountId,
        kind: "note",
        title: "Follow-up draft",
        body: draft,
        ownerId: data.members[0].id,
        buyerResponse: false,
      });
      draftRef.current = draft;
      await refresh();
      notify("Draft saved as a note. No email was sent.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function ask(q: string) {
    if (
      draft !== draftRef.current &&
      !window.confirm("Replace your edited draft with a new answer?")
    )
      return;
    setQuestion("");
    generate({ action: "question", question: q });
  }
  return (
    <div className={`ai-view ${onNavigate ? "in-dialog" : "standalone"}`}>
      <div className="ai-view-intro">
        <div className="juno-orb">
          <Sparkles size={31} strokeWidth={1.5} />
        </div>
        <span className="eyebrow">YOUR MOMENTUM PARTNER</span>
        <h1>
          A little help.
          <br />
          <span>A clearer next move.</span>
        </h1>
        <p>Meet Juno. Your relationships, with a little more perspective.</p>
        <span className="intelligence-mode">
          <i />
          Demo intelligence · grounded in your CRM
        </span>
      </div>
      {account && (
        <div className="ai-context">
          <CompanyLogo account={account} />
          <span>
            <strong>{account.name}</strong>
            <small>
              {deal?.name.split(" — ")[1]} · {money(deal?.amountCents || 0)}
            </small>
          </span>
          <span>IN CONTEXT</span>
        </div>
      )}
      {mutation.isPending ? (
        <div className="ai-thinking" role="status">
          <AiMark />
          <div>
            <strong>Finding a little clarity...</strong>
            <span>Looking at the facts in your workspace.</span>
          </div>
          <LoaderCircle className="spin" size={17} />
        </div>
      ) : mutation.isError ? (
        <div className="ai-answer error-state">
          <p>{mutation.error.message}</p>
          <Button onClick={() => generate(request)}>
            <RefreshCw size={15} />
            Try again
          </Button>
        </div>
      ) : (
        result && (
          <article className="ai-answer">
            <div className="ai-answer-heading">
              <AiMark small />
              <span>JUNO</span>
              <span className="ai-answer-time">
                {date(result.generatedAt, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <h2>{result.title}</h2>
            <p>{result.body}</p>
            {stale && (
              <div className="stale-insight" role="status">
                <RefreshCw size={15} />
                <span>
                  Your CRM changed. Refresh this suggestion before saving.
                </span>
                <button onClick={() => generate(request)}>Refresh</button>
              </div>
            )}
            {result.draft && (
              <div
                className="draft-composer"
                data-unsaved={draft !== draftRef.current ? "true" : "false"}
              >
                <div className="draft-composer-label">
                  <MailIcon />
                  <span>YOUR FOLLOW-UP DRAFT</span>
                  <span>Editable</span>
                </div>
                <textarea
                  aria-label="Follow-up draft"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setCopied(false);
                  }}
                  rows={12}
                />
                <div className="draft-actions">
                  <Button onClick={copy} disabled={!draft.trim()}>
                    {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
                    {copied ? "Copied" : "Copy draft"}
                  </Button>
                  <Button
                    onClick={saveNote}
                    disabled={saving || stale || !draft.trim()}
                  >
                    <FileText size={15} />
                    {saving ? "Saving..." : "Save as note"}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={stale}
                    onClick={() => {
                      onNavigate?.();
                      openModal({
                        type: "task",
                        dealId: deal!.id,
                        accountId: deal!.accountId,
                        title: `Follow up with ${account?.name}`,
                      });
                    }}
                  >
                    <Check size={15} />
                    Create next step
                  </Button>
                </div>
                <span className="draft-disclaimer">
                  Nothing is sent automatically. You're in control of the next
                  move.
                </span>
              </div>
            )}
            {result.dealIds.length > 0 && !result.draft && (
              <div className="ai-results">
                {result.dealIds.map((id) => {
                  const d = data.deals.find((d) => d.id === id);
                  if (!d) return null;
                  const a = data.accounts.find((a) => a.id === d.accountId);
                  return (
                    <Link key={id} to={`/deals/${id}`} onClick={onNavigate}>
                      <CompanyLogo account={a} />
                      <span>
                        <strong>{a?.name}</strong>
                        <small>{d.name.split(" — ")[1]}</small>
                      </span>
                      <b>{money(d.amountCents)}</b>
                      <ArrowUpRight size={15} />
                    </Link>
                  );
                })}
              </div>
            )}
            {result.evidence.length > 0 && (
              <div className="ai-evidence">
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  aria-expanded={showEvidence}
                >
                  <ShieldCheck size={14} />
                  Based on {result.evidence.length} source{" "}
                  {result.evidence.length === 1 ? "fact" : "facts"}
                  <ChevronDown size={14} />
                </button>
                {showEvidence && (
                  <div className="ai-evidence-list">
                    {result.evidence.map((e, i) => (
                      <div key={i}>
                        <strong>{e.label}</strong>
                        <p>{e.detail}</p>
                        {e.recordId &&
                          data.deals.some((d) => d.id === e.recordId) && (
                            <Link
                              to={`/deals/${e.recordId}`}
                              onClick={onNavigate}
                            >
                              View source
                              <ArrowUpRight size={12} />
                            </Link>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="ai-answer-foot">
              <span>
                <ShieldCheck size={13} />
                Suggestions, with context.
              </span>
              <button
                onClick={() => generate(request)}
                disabled={mutation.isPending}
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
            </div>
          </article>
        )
      )}
      <div className="ai-suggestions">
        <span>A FEW GOOD QUESTIONS</span>
        <div>
          {questions.map((q) => (
            <button
              key={q}
              disabled={mutation.isPending}
              onClick={() => ask(q)}
            >
              {q}
              <ArrowUpRight size={12} />
            </button>
          ))}
        </div>
      </div>
      <form
        className="ai-question-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) ask(question.trim());
        }}
      >
        <Sparkles size={18} />
        <input
          aria-label="Ask Juno about your CRM"
          placeholder="A question about your next move?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={1000}
        />
        <IconButton
          label="Ask Juno"
          disabled={!question.trim() || mutation.isPending}
          type="submit"
        >
          <Send size={17} />
        </IconButton>
      </form>
      <p className="ai-footnote">
        Juno helps you prepare. You make the relationship.
      </p>
    </div>
  );
}
function MailIcon() {
  return <ArrowRight size={14} />;
}
