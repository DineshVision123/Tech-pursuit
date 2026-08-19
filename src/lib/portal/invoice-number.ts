import "server-only";
import { sql } from "./db";

/** Shared by the `next-number` preview route and the actual create route —
 *  pulled out into its own module because Next.js Route Handler files may
 *  only export the HTTP-method functions (GET/POST/…) and a small allowlist
 *  of special names; any other named export fails the build.
 *
 * Format is `INV-<4-digit sequence>` (e.g. `INV-0001`) — no year segment.
 * A prior version embedded the year (`INV-2026-0003`) and reset the
 * sequence every calendar year; that was dropped because it made the
 * number noticeably longer than needed, which was the single biggest
 * contributor to the invoice-ready email's table not fitting a
 * phone-width inbox render (see `email.ts`'s table-sizing comments). The
 * `~ '^INV-[0-9]+$'` filter below only matches the new format, so old
 * `INV-<year>-<seq>` rows (which contain an extra `-`) are ignored rather
 * than misparsed — the sequence restarts at 1 under the new scheme
 * instead of trying to continue counting from the old one. */
export async function nextInvoiceNumber(): Promise<string> {
  const rows = await sql`
    select invoice_no from invoices
    where invoice_no ~ '^INV-[0-9]+$'
    order by (regexp_replace(invoice_no, '^INV-', ''))::int desc
    limit 1
  `;
  const last = rows[0]?.invoice_no as string | undefined;
  const lastSeq = last ? parseInt(last.slice(4), 10) : 0;
  const nextSeq = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
  return `INV-${String(nextSeq).padStart(4, "0")}`;
}
