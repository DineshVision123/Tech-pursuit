import { NextResponse } from "next/server";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";
import { getInvoice, getCompanyProfile } from "@/lib/portal/queries";
import { sendPaymentReminderEmail } from "@/lib/portal/email";
import type { InvoiceStatus } from "@/lib/portal/types";

export const runtime = "nodejs";

// Only an invoice the customer has actually been sent, and hasn't paid yet,
// is eligible — draft/rejected were never sent, and once `paid`, per the
// explicit requirement, reminders stop for good (there is no un-paying an
// invoice from here to resume them).
const REMINDABLE_STATUSES = new Set<InvoiceStatus>(["submitted", "approved"]);

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;
  const { id } = await params;

  const rows = await sql`select status, due_date, reminder_count from invoices where id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ success: false, data: null, error: "Invoice not found." }, { status: 404 });
  }
  const row = rows[0] as { status: InvoiceStatus; due_date: Date; reminder_count: number };

  if (!REMINDABLE_STATUSES.has(row.status)) {
    const why = row.status === "paid" ? "It's already marked paid." : "It hasn't been submitted yet.";
    return NextResponse.json(
      { success: false, data: null, error: `Can't send a reminder for this invoice. ${why}` },
      { status: 409 },
    );
  }

  const dueDate = new Date(row.due_date);
  dueDate.setUTCHours(0, 0, 0, 0);
  if (dueDate.getTime() >= new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime()) {
    return NextResponse.json(
      { success: false, data: null, error: "This invoice isn't overdue yet." },
      { status: 409 },
    );
  }

  const [invoice, company] = await Promise.all([getInvoice(id), getCompanyProfile()]);
  const followupNumber = row.reminder_count + 1;

  const sent = await sendPaymentReminderEmail(invoice, company, followupNumber);
  if (!sent.ok) {
    return NextResponse.json({ success: false, data: null, error: sent.error }, { status: 502 });
  }

  await sql`
    update invoices set reminder_count = ${followupNumber}, last_reminded_at = now() where id = ${id}
  `;
  await sql`
    insert into audit_log (invoice_id, action, actor, after)
    values (${id}, 'invoice.reminder_sent', ${member.email}, ${JSON.stringify({ followupNumber })})
  `;

  const updated = await getInvoice(id);
  return NextResponse.json({ success: true, data: updated, error: null });
}
