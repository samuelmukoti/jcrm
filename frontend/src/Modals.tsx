import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  CircleAlert,
  FileText,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useApp } from "./context";
import { ApiError, date, money, STAGES, write } from "./lib";
import { Button, CompanyLogo, Empty, Modal } from "./components/ui";
import type { ModalState } from "./types";

type EntityModal = Extract<
  NonNullable<ModalState>,
  { type: "deal" | "account" | "contact" | "task" | "activity" }
>;
export function WorkspaceModals({
  modal,
  onClose,
}: {
  modal: ModalState;
  onClose: () => void;
}) {
  if (!modal) return null;
  if (modal.type === "search") return <SearchModal onClose={onClose} />;
  if (modal.type === "settings") return <SettingsModal onClose={onClose} />;
  if (modal.type === "tour") return <TourModal onClose={onClose} />;
  if (modal.type === "notifications")
    return <NotificationsModal onClose={onClose} />;
  const names = {
    deal: "opportunity",
    account: "account",
    contact: "contact",
    task: "next step",
    activity: "activity",
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`${modal.id ? "Edit" : modal.type === "activity" ? "Log" : "A new"} ${names[modal.type]}`}
      description="A little context now makes the next conversation better."
    >
      <EntityForm key={JSON.stringify(modal)} modal={modal} onClose={onClose} />
    </Modal>
  );
}
function EntityForm({
  modal,
  onClose,
}: {
  modal: EntityModal;
  onClose: () => void;
}) {
  const { data, refresh, notify } = useApp(),
    navigate = useNavigate();
  const entity =
    modal.type === "deal"
      ? data.deals.find((d) => d.id === modal.id)
      : modal.type === "account"
        ? data.accounts.find((a) => a.id === modal.id)
        : modal.type === "contact"
          ? data.contacts.find((c) => c.id === modal.id)
          : modal.type === "task"
            ? data.tasks.find((t) => t.id === modal.id)
            : undefined;
  const selectedDeal = data.deals.find((d) => d.id === modal.dealId);
  const existing = entity as unknown as Record<string, unknown> | undefined;
  const [values, setValues] = useState<
    Record<string, string | number | boolean>
  >(() => ({
    name: String(existing?.name || ""),
    title: String(existing?.title || modal.title || ""),
    accountId: String(
      existing?.accountId ||
        modal.accountId ||
        selectedDeal?.accountId ||
        data.accounts[0]?.id ||
        "",
    ),
    contactId: String(existing?.contactId || ""),
    amount: Number(existing?.amountCents || 0) / 100 || "",
    stage: String(
      existing?.stage ||
        (modal.type === "deal" && STAGES.includes(modal.title || "")
          ? modal.title
          : "Qualified"),
    ),
    closeDate: String(existing?.closeDate || data.workspace.today),
    ownerId: String(existing?.ownerId || data.members[0].id),
    dueDate: String(existing?.dueDate || data.workspace.today),
    completed: Boolean(existing?.completed || false),
    dealId: String(existing?.dealId || modal.dealId || ""),
    industry: String(existing?.industry || "Technology"),
    website: String(existing?.website || ""),
    employees: Number(existing?.employees || 0),
    location: String(existing?.location || ""),
    description: String(existing?.description || ""),
    status: String(existing?.status || "Prospect"),
    email: String(existing?.email || ""),
    jobTitle: String(existing?.jobTitle || ""),
    phone: String(existing?.phone || ""),
    kind: "note",
    body: modal.body || "",
    buyerResponse: false,
  }));
  const [originalVersion] = useState(Number(existing?.version || 1));
  const [dirty, setDirty] = useState(false),
    [requestKey] = useState(
      () =>
        globalThis.crypto?.randomUUID?.() ||
        `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    );
  const set = (key: string, value: string | boolean) => {
    setDirty(true);
    setValues((v) => ({
      ...v,
      [key]: value,
      ...(key === "accountId" ? { contactId: "", dealId: "" } : {}),
    }));
  };
  const mutation = useMutation({
    mutationFn: async () => {
      const v = values;
      let body: unknown;
      if (modal.type === "deal")
        body = {
          name: v.name,
          accountId: v.accountId,
          contactId: v.contactId || null,
          amountCents: Math.round(Number(v.amount) * 100),
          stage: v.stage,
          closeDate: v.closeDate,
          ownerId: v.ownerId,
          version: originalVersion,
        };
      else if (modal.type === "account")
        body = {
          name: v.name,
          industry: v.industry,
          website: v.website,
          employees: Number(v.employees),
          location: v.location,
          description: v.description,
          ownerId: v.ownerId,
          status: v.status,
          version: originalVersion,
        };
      else if (modal.type === "contact")
        body = {
          name: v.name,
          accountId: v.accountId,
          email: v.email,
          jobTitle: v.jobTitle,
          phone: v.phone,
        };
      else if (modal.type === "task")
        body = {
          title: v.title,
          accountId: v.accountId,
          dealId: v.dealId || null,
          dueDate: v.dueDate,
          ownerId: v.ownerId,
          completed: v.completed,
          version: originalVersion,
          requestKey,
        };
      else
        body = {
          title: v.title,
          body: v.body,
          accountId: v.accountId,
          dealId: v.dealId || null,
          kind: v.kind,
          ownerId: v.ownerId,
          buyerResponse: v.buyerResponse,
        };
      return write<{ id: string }>(
        `/${modal.type === "activity" ? "activities" : modal.type === "deal" ? "deals" : modal.type === "account" ? "accounts" : modal.type === "contact" ? "contacts" : "tasks"}${modal.id ? "/" + modal.id : ""}`,
        body,
        modal.id ? "PUT" : "POST",
      );
    },
    onSuccess: async (result) => {
      setDirty(false);
      await refresh();
      onClose();
      notify(
        modal.type === "activity"
          ? "Activity recorded. Your team is in the loop."
          : modal.id
            ? "Changes saved. All up to date."
            : modal.type === "task"
              ? "Next step scheduled. Good things are moving."
              : "Added to your workspace. A new possibility.",
      );
      if (!modal.id && modal.type === "deal") navigate(`/deals/${result.id}`);
      if (!modal.id && modal.type === "account")
        navigate(`/accounts/${result.id}`);
    },
  });
  const errors =
    mutation.error instanceof ApiError ? mutation.error.fields : undefined;
  function input(
    label: string,
    name: string,
    type = "text",
    required = false,
    maxLength = 180,
  ) {
    return (
      <label className="form-field" key={name}>
        <span>
          {label}
          {required && <i aria-hidden="true">*</i>}
        </span>
        <input
          name={name}
          type={type}
          required={required}
          maxLength={maxLength}
          min={type === "number" ? "0" : undefined}
          step={name === "amount" ? ".01" : undefined}
          value={String(values[name] ?? "")}
          onChange={(e) => set(name, e.target.value)}
          aria-invalid={!!errors?.[name === "amount" ? "amountCents" : name]}
        />
        {errors?.[name === "amount" ? "amountCents" : name] && (
          <small role="alert">
            {errors[name === "amount" ? "amountCents" : name]}
          </small>
        )}
      </label>
    );
  }
  function select(
    label: string,
    name: string,
    options: { value: string; label: string }[],
    optional = false,
  ) {
    return (
      <label className="form-field" key={name}>
        <span>
          {label}
          {!optional && <i aria-hidden="true">*</i>}
        </span>
        <select
          name={name}
          required={!optional}
          disabled={name === "accountId" && modal.type === "deal" && !!modal.id}
          value={String(values[name])}
          onChange={(e) => set(name, e.target.value)}
        >
          {optional && <option value="">No selection</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors?.[name === "amount" ? "amountCents" : name] && (
          <small role="alert">
            {errors[name === "amount" ? "amountCents" : name]}
          </small>
        )}
      </label>
    );
  }
  const accountField = select(
    "Account",
    "accountId",
    data.accounts.map((a) => ({ value: a.id, label: a.name })),
  );
  const ownerField = select(
    "Owner",
    "ownerId",
    data.members.map((m) => ({ value: m.id, label: m.name })),
  );
  const dealField = select(
    "Related opportunity",
    "dealId",
    data.deals
      .filter((d) => d.accountId === values.accountId)
      .map((d) => ({ value: d.id, label: d.name })),
    true,
  );
  const textArea = (label: string, name: string, required = false) => (
    <label className="form-field">
      <span>
        {label}
        {required && <i aria-hidden="true">*</i>}
      </span>
      <textarea
        name={name}
        required={required}
        value={String(values[name])}
        rows={4}
        maxLength={name === "body" ? 8000 : 4000}
        onChange={(e) => set(name, e.target.value)}
      />
    </label>
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }
  return (
    <form
      className="entity-form"
      onSubmit={submit}
      data-unsaved={dirty && !mutation.isSuccess ? "true" : "false"}
    >
      {modal.type === "deal" && (
        <>
          {input("Opportunity name", "name", "text", true)}
          {accountField}
          <div className="form-grid">
            {input("Value (USD)", "amount", "number", true)}
            {select(
              "Stage",
              "stage",
              STAGES.map((s) => ({ value: s, label: s })),
            )}
          </div>
          <div className="form-grid">
            {input("Target close date", "closeDate", "date", true)}
            {ownerField}
          </div>
          {select(
            "Primary contact",
            "contactId",
            data.contacts
              .filter((c) => c.accountId === values.accountId)
              .map((c) => ({ value: c.id, label: c.name })),
            true,
          )}
        </>
      )}
      {modal.type === "account" && (
        <>
          {input("Company name", "name", "text", true, 120)}
          <div className="form-grid">
            {input("Industry", "industry", "text", true, 100)}
            {input("Website", "website", "text", false, 200)}
          </div>
          <div className="form-grid">
            {input("Employees", "employees", "number")}
            {input("Location", "location")}
          </div>
          {textArea("About this company", "description")}
          <div className="form-grid">
            {ownerField}
            {select(
              "Relationship",
              "status",
              ["Prospect", "Customer", "Partner"].map((s) => ({
                value: s,
                label: s,
              })),
            )}
          </div>
        </>
      )}
      {modal.type === "contact" && (
        <>
          {input("Full name", "name", "text", true, 120)}
          {accountField}
          {input("Email address", "email", "email", true, 200)}
          <div className="form-grid">
            {input("Job title", "jobTitle", "text", false, 120)}
            {input("Phone", "phone", "tel", false, 60)}
          </div>
        </>
      )}
      {modal.type === "task" && (
        <>
          {input("Next step", "title", "text", true, 200)}
          {accountField}
          {dealField}
          <div className="form-grid">
            {input("Due date", "dueDate", "date", true)}
            {ownerField}
          </div>
          {modal.id && (
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={Boolean(values.completed)}
                onChange={(e) => set("completed", e.target.checked)}
              />
              This step is complete
            </label>
          )}
        </>
      )}
      {modal.type === "activity" && (
        <>
          {input("Activity title", "title", "text", true)}
          {accountField}
          {dealField}
          <div className="form-grid">
            {select(
              "Activity type",
              "kind",
              ["note", "email", "meeting", "call"].map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              })),
            )}
            {ownerField}
          </div>
          {textArea("What happened?", "body", true)}
          {values.dealId && (
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={Boolean(values.buyerResponse)}
                onChange={(e) => set("buyerResponse", e.target.checked)}
              />
              <span>
                This activity includes a new response from the buyer.
                <small>Updates the last buyer activity date.</small>
              </span>
            </label>
          )}
        </>
      )}
      {mutation.isError && (
        <div className="form-error" role="alert">
          <CircleAlert size={16} />
          <span>{mutation.error.message}</span>
          {mutation.error instanceof ApiError &&
            mutation.error.status === 409 && (
              <button
                type="button"
                onClick={async () => {
                  await refresh();
                  notify(
                    "Workspace refreshed. Reopen this form to use the latest record; copy any unsaved text first.",
                  );
                }}
              >
                Refresh workspace
              </button>
            )}
        </div>
      )}
      <div className="form-actions">
        <Button
          type="button"
          onClick={() => {
            if (!dirty || window.confirm("Discard the changes in this form?"))
              onClose();
          }}
        >
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <LoaderCircle size={15} className="spin" />
          ) : (
            <Check size={15} />
          )}
          {mutation.isPending
            ? "Saving..."
            : modal.type === "activity"
              ? "Save activity"
              : modal.type === "task"
                ? "Save next step"
                : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
function SearchModal({ onClose }: { onClose: () => void }) {
  const { data, openModal } = useApp(),
    navigate = useNavigate(),
    [search, setSearch] = useState("");
  const q = search.toLowerCase();
  const accounts = data.accounts
      .filter((a) => a.name.toLowerCase().includes(q))
      .slice(0, 4),
    contacts = data.contacts
      .filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q))
      .slice(0, 4),
    deals = data.deals
      .filter((d) => d.name.toLowerCase().includes(q))
      .slice(0, 4);
  const go = (path: string) => {
    onClose();
    navigate(path);
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="A little shortcut to anything."
      description="Search your companies, people, and opportunities."
      className="search-modal"
    >
      <div className="command-search">
        <Search size={19} />
        <input
          autoFocus
          aria-label="Search all records"
          placeholder="A company, a person, a possibility..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="command-results">
        {!search && (
          <div className="command-actions">
            <button onClick={() => openModal({ type: "deal" })}>
              <Plus size={16} />
              New opportunity
              <ArrowUpRight size={14} />
            </button>
            <button onClick={() => openModal({ type: "task" })}>
              <Check size={16} />
              Add a next step
              <ArrowUpRight size={14} />
            </button>
          </div>
        )}
        {deals.length > 0 && (
          <>
            <span className="command-group">OPPORTUNITIES</span>
            {deals.map((d) => (
              <button key={d.id} onClick={() => go(`/deals/${d.id}`)}>
                <CompanyLogo
                  account={data.accounts.find((a) => a.id === d.accountId)}
                />
                <span>
                  <strong>{d.name}</strong>
                  <small>
                    {money(d.amountCents)} · {d.stage}
                  </small>
                </span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </>
        )}
        {accounts.length > 0 && (
          <>
            <span className="command-group">COMPANIES</span>
            {accounts.map((a) => (
              <button key={a.id} onClick={() => go(`/accounts/${a.id}`)}>
                <CompanyLogo account={a} />
                <span>
                  <strong>{a.name}</strong>
                  <small>{a.industry}</small>
                </span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </>
        )}
        {contacts.length > 0 && (
          <>
            <span className="command-group">PEOPLE</span>
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => openModal({ type: "contact", id: c.id })}
              >
                <span className="search-person">
                  <Users size={17} />
                </span>
                <span>
                  <strong>{c.name}</strong>
                  <small>{c.email}</small>
                </span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </>
        )}
        {!accounts.length && !contacts.length && !deals.length && (
          <Empty title="No matches, yet." search>
            Try a shorter name or another keyword.
          </Empty>
        )}
      </div>
      <div className="command-footer">
        <span>
          <kbd>tab</kbd> to navigate
        </span>
        <span>
          <kbd>esc</kbd> to close
        </span>
      </div>
    </Modal>
  );
}
function SettingsModal({ onClose }: { onClose: () => void }) {
  const { data, refresh, notify } = useApp(),
    navigate = useNavigate(),
    [confirm, setConfirm] = useState(false);
  const mutation = useMutation({
    mutationFn: () => write("/reset", {}),
    onSuccess: async () => {
      await refresh();
      onClose();
      navigate("/");
      notify("A fresh start. Your demo workspace has been restored.");
    },
  });
  return (
    <Modal
      open
      onClose={onClose}
      title="Your little corner of clarity."
      description="Workspace details and demo controls."
    >
      <div className="settings-body">
        <div className="settings-workspace">
          <span className="workspace-symbol">
            <Building2 size={24} />
          </span>
          <div>
            <h3>{data.workspace.name}</h3>
            <p>A fictional team. Real possibilities.</p>
          </div>
          <span className="demo-tag">DEMO</span>
        </div>
        <dl>
          <div>
            <dt>Workspace timezone</dt>
            <dd>UTC</dd>
          </div>
          <div>
            <dt>Default currency</dt>
            <dd>USD · US dollar</dd>
          </div>
          <div>
            <dt>AI assistant</dt>
            <dd>Juno · demo intelligence</dd>
          </div>
          <div>
            <dt>Team members</dt>
            <dd>{data.members.length} fictional teammates</dd>
          </div>
          <div>
            <dt>Your session</dt>
            <dd>Private demo · expires in 7 days</dd>
          </div>
        </dl>
        <div className="reset-box">
          <span>
            <RefreshCw size={17} />
            <strong>A fresh start, whenever you need it.</strong>
          </span>
          <p>
            Restore the original companies, opportunities, and tasks. Your
            changes in this browser's demo will be removed.
          </p>
          {confirm ? (
            <div className="reset-confirm">
              <p>Ready to reset this workspace?</p>
              <Button onClick={() => setConfirm(false)}>Keep exploring</Button>
              <Button
                variant="danger"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? "Restoring..." : "Yes, reset demo"}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setConfirm(true)}>
              <RefreshCw size={14} />
              Reset demo workspace
            </Button>
          )}
          {mutation.isError && (
            <p className="form-error" role="alert">
              {mutation.error.message}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
function TourModal({ onClose }: { onClose: () => void }) {
  const { data, openAI } = useApp(),
    navigate = useNavigate(),
    [step, setStep] = useState(0);
  const primary =
    data.deals.find(
      (d) =>
        data.accounts.find((a) => a.id === d.accountId)?.name === "Acme" &&
        d.stage === "Proposal",
    ) || data.deals[0];
  const steps = [
    {
      title: "See the bigger picture.",
      text: "Your overview connects the numbers to the people and opportunities behind them. Start with the priority Juno highlights.",
      icon: Building2,
    },
    {
      title: "Find the next good step.",
      text: "Open a deal to see the buyer, proposal, activity, and the facts behind its priority. A clear next step makes a difference.",
      icon: FileText,
    },
    {
      title: "Add a little Juno.",
      text: "Draft a thoughtful follow-up, make it yours, then save a note or schedule a task. Nothing is sent automatically.",
      icon: Sparkles,
    },
  ];
  const current = steps[step];
  return (
    <Modal
      open
      onClose={onClose}
      title="From potential to progress."
      description="Your three-minute introduction to a little more momentum."
      className="tour-modal"
    >
      <div className="tour-body">
        <span className="tour-symbol">
          <current.icon size={33} strokeWidth={1.5} />
        </span>
        <span className="eyebrow">A LITTLE LOOK AROUND · {step + 1} OF 3</span>
        <h2>{current.title}</h2>
        <p>{current.text}</p>
        <div className="tour-dots">
          {steps.map((_, i) => (
            <button
              key={i}
              aria-label={`Tour step ${i + 1}`}
              className={i === step ? "active" : ""}
              onClick={() => setStep(i)}
            />
          ))}
        </div>
        <div className="tour-actions">
          <Button onClick={onClose}>Explore on my own</Button>
          {step < 2 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>
              Next
              <ArrowRight size={15} />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                navigate(`/deals/${primary.id}`);
                openAI({ action: "draft", dealId: primary.id });
              }}
            >
              Try it with Acme
              <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
function NotificationsModal({ onClose }: { onClose: () => void }) {
  const { data } = useApp(),
    navigate = useNavigate();
  const tasks = data.tasks.filter(
    (t) => !t.completed && t.dueDate <= data.workspace.today,
  );
  return (
    <Modal
      open
      onClose={onClose}
      title="A few things on your radar."
      description="Today's tasks and anything waiting for a little attention."
    >
      <div className="notification-list">
        {tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              onClose();
              navigate(t.dealId ? `/deals/${t.dealId}` : "/work");
            }}
          >
            <span className="notification-task-icon">
              <Check size={17} />
            </span>
            <span>
              <strong>{t.title}</strong>
              <small>
                {data.accounts.find((a) => a.id === t.accountId)?.name} ·{" "}
                {t.dueDate < data.workspace.today ? "Overdue" : date(t.dueDate)}
              </small>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
        {!tasks.length && (
          <Empty title="A little breathing room.">
            You're all caught up for today.
          </Empty>
        )}
      </div>
    </Modal>
  );
}
