import type { Customer, InvoiceStatus, PaymentTerm } from "./types";

/** "ParentName:CustomerName" when nested under a parent, else the plain name. */
export function displayNameWithParent(
  c: Pick<Customer, "name" | "isSubCustomer" | "parentCustomerName">,
): string {
  return c.isSubCustomer && c.parentCustomerName ? `${c.parentCustomerName}:${c.name}` : c.name;
}

/** Cents → "$1,234.56". Money is always integer cents end-to-end. */
export function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = (abs / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${dollars}`;
}

/** Compact money for tiles: $19.9K / $1.2M. */
export function moneyCompact(cents: number): string {
  const dollars = cents / 100;
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return fmt.format(dollars);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Month name only (no year) — a line item's Month field is just "which
 *  month's timesheet this is", not a specific calendar date. */
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Current month name, for defaulting a new line item's Month field. */
export function currentMonthName(): string {
  return MONTH_NAMES[new Date().getMonth()];
}

export function fromNow(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export const TERM_LABEL: Record<PaymentTerm, string> = {
  due_on_receipt: "Due on receipt",
  net_15: "Net 15",
  net_30: "Net 30",
  net_45: "Net 45",
  net_60: "Net 60",
  custom: "Custom",
};

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  rejected: "Rejected",
  submitted: "Submitted",
  paid: "Paid",
};

/** The five statuses in lifecycle order — used for the pipeline stepper. */
export const STATUS_ORDER: InvoiceStatus[] = ["draft", "approved", "submitted", "paid"];

export function humanizeAction(action: string): string {
  const map: Record<string, string> = {
    "invoice.created": "created invoice",
    "invoice.edited": "edited invoice",
    "invoice.status_changed": "changed status",
    "invoice.attachment_added": "added attachment",
    "invoice.attachment_removed": "removed attachment",
    "bill_rate.created": "added bill rate",
    "bill_rate.updated": "updated bill rate",
  };
  return map[action] ?? action;
}
