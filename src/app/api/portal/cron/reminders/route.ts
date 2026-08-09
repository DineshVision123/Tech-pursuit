import { NextResponse } from "next/server";
import { sql } from "@/lib/portal/db";
import { getInvoice, getCompanyProfile } from "@/lib/portal/queries";
import { sendPaymentReminderEmail } from "@/lib/portal/email";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Days between one follow-up and the next — the first reminder fires as
 *  soon as an invoice is overdue, every reminder after that waits this many
 *  days since the last one. Override with REMINDER_INTERVAL_DAYS if a
 *  weekly cadence isn't what you want. */
const DEFAULT_INTERVAL_DAYS = 7;

function intervalDays(): number {
  const raw = Number(process.env.REMINDER_INTERVAL_DAYS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_INTERVAL_DAYS;
}

/**
 * Automatic payment-reminder sweep — meant to be hit once a day by Vercel
 * Cron (see `vercel.json`), never by a person or the browser. For every
 * invoice that's `submitted`/`approved`, overdue, and due for its next
 * follow-up (first one as soon as overdue, then every `intervalDays()`
 * after the last), sends the next "Follow-up #N" email and advances its
 * counter — exactly the same `sendPaymentReminderEmail` +
 * `reminder_count`/`last_reminded_at` bookkeeping the manual "Send
 * reminder" button in `InvoiceActions.tsx` uses, so the two stay in sync
 * regardless of which one fires next. Stops for good once an invoice is
 * marked `paid` — that status is simply excluded from the query below,
 * permanently (there's no un-paying an invoice to resume reminders).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const due = await sql`
    select id from invoices
    where status in ('submitted', 'approved')
      and due_date < current_date
      and (
        reminder_count = 0
        or last_reminded_at < now() - (${intervalDays()} * interval '1 day')
      )
  `;

  const company = await getCompanyProfile();
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const row of due) {
    const id = row.id as string;
    try {
      const invoice = await getInvoice(id);
      const followupNumber = invoice.reminderCount + 1;
      const sent = await sendPaymentReminderEmail(invoice, company, followupNumber);
      if (!sent.ok) {
        results.push({ id, ok: false, error: sent.error });
        continue;
      }
      await sql`
        update invoices set reminder_count = ${followupNumber}, last_reminded_at = now() where id = ${id}
      `;
      await sql`
        insert into audit_log (invoice_id, action, actor, after)
        values (${id}, 'invoice.reminder_sent', 'cron', ${JSON.stringify({ followupNumber, automatic: true })})
      `;
      results.push({ id, ok: true });
    } catch (err) {
      results.push({ id, ok: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return NextResponse.json({
    success: true,
    checked: due.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok),
  });
}
