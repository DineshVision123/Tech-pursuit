import type { InvoiceStatus } from "./types";

/** CSS-variable-backed color pair per status, matching globals.css tokens. */
export const STATUS_STYLE: Record<InvoiceStatus, { fg: string; bg: string }> = {
  draft: { fg: "var(--pending)", bg: "var(--pending-soft)" },
  approved: { fg: "var(--approved)", bg: "var(--approved-soft)" },
  rejected: { fg: "var(--rejected)", bg: "var(--rejected-soft)" },
  submitted: { fg: "var(--submitted)", bg: "var(--submitted-soft)" },
  paid: { fg: "var(--paid)", bg: "var(--paid-soft)" },
};
