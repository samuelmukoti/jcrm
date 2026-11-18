export type Member = {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
};
export type Account = {
  id: string;
  name: string;
  industry: string;
  website: string;
  initials: string;
  color: string;
  employees: number;
  location: string;
  description: string;
  ownerId: string;
  status: string;
  version: number;
};
export type Contact = {
  id: string;
  accountId: string;
  name: string;
  email: string;
  jobTitle: string;
  phone: string;
  initials: string;
  color: string;
};
export type Deal = {
  id: string;
  accountId: string;
  contactId: string | null;
  name: string;
  amountCents: number;
  stage: string;
  closeDate: string;
  actualCloseDate: string | null;
  ownerId: string;
  lastBuyerActivity: string;
  createdAt: string;
  version: number;
};
export type Activity = {
  id: string;
  dealId: string | null;
  accountId: string;
  kind: string;
  title: string;
  body: string;
  happenedAt: string;
  ownerId: string;
};
export type Task = {
  id: string;
  dealId: string | null;
  accountId: string;
  title: string;
  dueDate: string;
  ownerId: string;
  completed: boolean;
  version: number;
};
export type Evidence = {
  label: string;
  detail: string;
  recordId: string | null;
};
export type Insight = {
  dealId: string;
  score: number;
  level: string;
  summary: string;
  evidence: Evidence[];
};
export type AiResult = {
  title: string;
  body: string;
  draft: string | null;
  evidence: Evidence[];
  dealIds: string[];
  mode: string;
  generatedAt: string;
};
export type StageSummary = {
  stage: string;
  amountCents: number;
  count: number;
  probability: number;
};
export type Snapshot = {
  workspace: { id: string; name: string; timezone: string; today: string };
  members: Member[];
  accounts: Account[];
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  tasks: Task[];
  insights: Insight[];
  dashboard: {
    openPipelineCents: number;
    weightedForecastCents: number;
    wonValueCents: number;
    winRate: number | null;
    openCount: number;
    wonCount: number;
    lostCount: number;
    stages: StageSummary[];
    trend: { label: string; amountCents: number }[];
  };
};
export type ModalState =
  | {
      type: "deal" | "account" | "contact" | "task" | "activity";
      id?: string;
      accountId?: string;
      dealId?: string;
      title?: string;
      body?: string;
    }
  | { type: "settings" }
  | { type: "tour" }
  | { type: "search" }
  | { type: "notifications" }
  | null;
export type AiState = {
  action: "briefing" | "risk" | "draft" | "question";
  dealId?: string;
  question?: string;
};
