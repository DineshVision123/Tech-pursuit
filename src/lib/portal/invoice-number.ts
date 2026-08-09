import "server-only";
import { sql } from "./db";

/** Shared by the `next-number` preview route and the actual create route —
 *  pulled out into its own module because Next.js Route Handler files may
 *  only export the HTTP-method functions (GET/POST/…) and a small allowlist
 *  of special names; any other named export fails the build. */
export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const rows = await sql`
    select invoice_no from invoices
    where invoice_no like ${`INV-${year}-%`}
    order by invoice_no desc limit 1
  `;
  const last = rows[0]?.invoice_no as string | undefined;
  const lastSeq = last ? parseInt(last.split("-")[2] ?? "0", 10) : 0;
  const nextSeq = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
  return `INV-${year}-${String(nextSeq).padStart(4, "0")}`;
}
