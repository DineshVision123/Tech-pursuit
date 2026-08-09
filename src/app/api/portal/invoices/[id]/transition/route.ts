import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";
import { getInvoice, getCompanyProfile } from "@/lib/portal/queries";
import { sendInvoiceSubmittedEmail } from "@/lib/portal/email";
import type { InvoiceStatus } from "@/lib/portal/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  to: z.enum(["draft", "approved", "rejected", "submitted", "paid"]),
  reason: z.string().nullable().optional(),
  emailSubject: z.string().nullable().optional(),
});

/**
 * Reconciled from BOTH real call sites, not invented independently:
 * `InvoiceActions.tsx`'s action-bar `NEXT` map only covers transitions
 * offered *there* (approved→submitted/rejected, submitted→paid,
 * rejected→draft) — it deliberately shows nothing for `draft`, because
 * `InvoiceForm.tsx`'s own compose-on-save step calls
 * `transitionInvoice(id, "submitted", ...)` directly for a draft/new
 * invoice, bypassing the action bar entirely. Both paths need to be valid
 * here or one of the two real UI flows breaks.
 */
const ALLOWED_NEXT: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["submitted"],
  approved: ["submitted", "rejected"],
  submitted: ["paid"],
  rejected: ["draft"],
  paid: [],
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;
  const { id } = await params;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, data: null, error: "Invalid request." }, { status: 400 });
  }
  const { to, reason, emailSubject } = parsed.data;

  const rows = await sql`select status from invoices where id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ success: false, data: null, error: "Invoice not found." }, { status: 404 });
  }
  const from = (rows[0] as { status: InvoiceStatus }).status;

  if (!ALLOWED_NEXT[from].includes(to)) {
    return NextResponse.json(
      { success: false, data: null, error: `Can't move an invoice from ${from} to ${to}.` },
      { status: 409 },
    );
  }

  // Moving to "submitted" is the one transition that's supposed to actually
  // email the customer (the "Review and submit" / create-form compose step
  // both funnel here). Send it FIRST and bail out — leaving the invoice in
  // its current status — if it fails, rather than marking an invoice
  // "submitted" when the customer was never actually notified.
  if (to === "submitted") {
    const [invoice, company] = await Promise.all([getInvoice(id), getCompanyProfile()]);
    const subject = emailSubject?.trim() || `Your invoice is ready — ${invoice.invoiceNo} from ${company.companyName}`;
    const sent = await sendInvoiceSubmittedEmail(invoice, company, subject);
    if (!sent.ok) {
      return NextResponse.json({ success: false, data: null, error: sent.error }, { status: 502 });
    }
  }

  await sql`update invoices set status = ${to}, updated_at = now() where id = ${id}`;
  await sql`
    insert into audit_log (invoice_id, action, actor, reason, before, after)
    values (
      ${id}, 'invoice.status_changed', ${member.email}, ${reason ?? null},
      ${JSON.stringify({ status: from })}, ${JSON.stringify({ status: to })}
    )
  `;
  if (to === "submitted") {
    await sql`
      insert into audit_log (invoice_id, action, actor)
      values (${id}, 'invoice.emailed', ${member.email})
    `;
  }

  const invoice = await getInvoice(id);
  return NextResponse.json({ success: true, data: invoice, error: null });
}
