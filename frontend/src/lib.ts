import type { Deal, Snapshot } from "./types";
export const STAGES = [
  "Qualified",
  "Discovery",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];
export const STAGE_COLORS: Record<string, string> = {
  Qualified: "#7799d8",
  Discovery: "#ad8ce0",
  Proposal: "#e2ad60",
  Negotiation: "#6c9f91",
  Won: "#469b72",
  Lost: "#bd7d87",
};
export const money = (cents: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact && Math.abs(cents) >= 10000000 ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(cents / 100);
export const date = (
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) =>
  new Date(
    value.length === 10 ? `${value}T12:00:00Z` : value,
  ).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
export const openDeal = (d: Deal) => !["Won", "Lost"].includes(d.stage);
export function inPeriod(d: Deal, today: string, period: string) {
  if (period === "all") return true;
  const t = new Date(`${today}T00:00:00Z`),
    c = new Date(
      `${(!openDeal(d) && d.actualCloseDate) || d.closeDate}T00:00:00Z`,
    );
  return (
    t.getUTCFullYear() === c.getUTCFullYear() &&
    (period === "month"
      ? t.getUTCMonth() === c.getUTCMonth()
      : Math.floor(t.getUTCMonth() / 3) === Math.floor(c.getUTCMonth() / 3))
  );
}
export function filteredDeals(data: Snapshot, period: string, owner: string) {
  return data.deals.filter(
    (d) =>
      (owner === "all" || d.ownerId === owner) &&
      inPeriod(d, data.workspace.today, period),
  );
}
export class ApiError extends Error {
  fields?: Record<string, string>;
  status: number;
  constructor(
    message: string,
    status: number,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw new ApiError(
      body?.message ||
        (response.status >= 500
          ? "Something interrupted that request. Your changes are still here. Please try again."
          : "That request could not be completed."),
      response.status,
      body?.fields,
    );
  }
  return response.json();
}
export const write = <T = { id: string }>(
  path: string,
  body: unknown,
  method = "POST",
) => api<T>(path, { method, body: JSON.stringify(body) });
