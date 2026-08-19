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
 * phone-width inbox render (see `email.ts`'s table-sizing comments).
 *
 * Continues the existing count rather than restarting at 1: both the old
 * `INV-<year>-<seq>` format and the new `INV-<seq>` format end in
 * `-<digits>`, so `'.*-'` (greedy) strips everything up to and including
 * the *last* hyphen from every existing invoice_no, leaving just that
 * trailing sequence to compare — e.g. `INV-2026-0002` and a fresh
 * `INV-0002` both read as `2`. With `INV-2026-0001`/`INV-2026-0002`
 * already on file, the next number is `INV-0003`, not a reset to
 * `INV-0001`. */
export async function nextInvoiceNumber(): Promise<string> {
  const rows = await sql`
    select invoice_no from invoices
    where invoice_no ~ '-[0-9]+$'
    order by (regexp_replace(invoice_no, '.*-', ''))::int desc
    limit 1
  `;
  const last = rows[0]?.invoice_no as string | undefined;
  const lastSeq = last ? parseInt(last.slice(last.lastIndexOf("-") + 1), 10) : 0;
  const nextSeq = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
  return `INV-${String(nextSeq).padStart(4, "0")}`;
}
