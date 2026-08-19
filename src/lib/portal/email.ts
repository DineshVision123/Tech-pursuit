import { Resend } from "resend";
import { money, formatDate } from "./format";
import type { CompanyProfile, Invoice } from "./types";

type SendResult = { readonly ok: true } | { readonly ok: false; readonly error: string };

/**
 * Sends a login OTP code via Resend. Reuses the same `RESEND_API_KEY` the
 * main site's contact form already uses (`src/lib/email.ts`) — one Resend
 * account for the one deployment now — but is its own function/module
 * rather than sharing code with the contact-form sender, per the "keep
 * portal functionality modular" instruction. `INVOICE_FROM_EMAIL` is a
 * separate env var so the two features can show different "From" identities
 * even though they share a provider and API key.
 *
 * Deliberately has no fallback-log-only mode like the contact form's
 * `sendContactEmail` — a login code that silently never sends would just
 * look like a broken login screen to whoever's testing it, so misconfigured
 * credentials fail loudly here instead.
 */
export async function sendInvoiceOtpEmail(email: string, code: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      ok: false,
      error: "Email isn't configured yet — set RESEND_API_KEY and INVOICE_FROM_EMAIL.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: `${code} is your Tech Pursuit invoice portal code`,
      text: `Your sign-in code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    });

    if (error) {
      console.error("[invoice-otp] Resend API error:", error);
      return { ok: false, error: "Failed to send the code." };
    }

    return { ok: true };
  } catch (err) {
    console.error("[invoice-otp] Unexpected error sending email:", err);
    return { ok: false, error: "Unexpected error sending the code." };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://techpursuitsystems.com").replace(/\/$/, "");
}

/**
 * Customer `cc`/`bcc`/`secondaryEmail` fields are free-text inputs that
 * (like a normal email client's Cc box) people fill in with more than one
 * address separated by a comma or semicolon — see the `multiple` email
 * input in `InvoiceForm.tsx`. Resend's `cc`/`bcc` params want one valid
 * address per array element, so split/trim/dedupe here rather than shipping
 * a raw "a@x.com, b@y.com" string as a single element — Resend rejects that
 * whole send with a 422 `validation_error` instead of silently dropping it.
 */
function splitEmails(value: string | null | undefined): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(/[,;]/)
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  );
}

/** Same rough "as low as $X/mo" estimate as `InvoicePreview.tsx`'s
 *  `estimateMonthly` — illustrative only, not a real financing quote. */
function estimateMonthly(totalCents: number): string {
  return money(Math.round(totalCents / 24));
}

const EMAIL_TABLE_LINE = "#000000";
const EMAIL_TABLE_TEXT = "#111827";

/** Mirrors `InvoicePreview.tsx`'s `EMAIL_TABLE_COLS` — widths are hints
 *  for the table's default auto layout, not a hard cap. `table-layout:
 *  fixed` was tried and reverted: it made these percentages an enforced
 *  ceiling, which sounds safer, but a fixed column that's a hair too
 *  narrow for its real-world rendered content doesn't just wrap — with
 *  `overflow:hidden` it silently truncates the *value itself* ("Aug 19,
 *  202" missing its final digit, an invoice no. missing its last two
 *  digits), and header words that don't fit break mid-word ("EMPLOY"/
 *  "EE"). Both are worse than the original bug (a column getting
 *  pushed off-screen), because they show something that looks like
 *  real data but isn't. Auto layout can't silently corrupt a value like
 *  that — a column either gets the width its nowrap content needs, or
 *  (for headers only, which are allowed to wrap) it wraps cleanly at a
 *  space. `nextInvoiceNumber()` dropping the year (`INV-0001` instead of
 *  `INV-2026-0003`) is what actually bought back the room Invoice
 *  Amount ($) needed — not a layout trick. */
const EMAIL_TABLE_COLS = [
  { label: "Employee", align: "left", width: "20%" },
  { label: "Invoice No.", align: "left", width: "13%" },
  { label: "Invoice Date", align: "left", width: "16%" },
  { label: "Due Date", align: "left", width: "16%" },
  { label: "Qty", align: "center", width: "8%" },
  { label: "Rate", align: "right", width: "12%" },
  { label: "Invoice Amount ($)", align: "right", width: "15%" },
] as const;

/** Fixed-format values stay `nowrap` — a date or invoice no. split across
 *  two lines reads as two separate values. Only the variable-length
 *  employee name and the headers (see the `<th>` below, no `white-space`
 *  override) wrap; that's the table's pressure-release instead of a
 *  layout that can silently cut a value short (see the comment on
 *  `EMAIL_TABLE_COLS`). The wrapping `<div>` around the table still gets
 *  `overflow-x:auto` as a last-resort fallback for the rare render that
 *  genuinely doesn't fit — scrolling a value is always better than
 *  showing a wrong one. */
function emailCellStyle(align: "left" | "center" | "right" = "left"): string {
  return `padding:2px 2px;border:1px solid ${EMAIL_TABLE_LINE};text-align:${align};white-space:nowrap;`;
}

/**
 * Byte-for-byte port of `InvoicePreview.tsx`'s `EmailPreview` component —
 * the compose modal's live preview IS this function's output (rendered as
 * JSX there, raw HTML here), so what staff see before hitting "Confirm and
 * submit" is what actually lands in the customer's inbox. Change one,
 * change the other, or the preview starts lying.
 */
function buildInvoiceEmailHtml(invoice: Invoice, company: CompanyProfile): string {
  const billTo = invoice.customer.company || invoice.customer.name;
  const companyAddress = [
    company.addressLine1,
    company.addressLine2,
    [[company.city, company.state].filter(Boolean).join(", "), company.postalCode]
      .filter(Boolean)
      .join(" ")
      .trim() || null,
    company.country,
  ]
    .filter((s): s is string => Boolean(s && s.trim()))
    .join(", ");
  const logoUrl = company.logoUrl ? `${siteUrl()}${company.logoUrl}` : null;

  const headerCells = EMAIL_TABLE_COLS.map(
    (c) =>
      `<th style="width:${c.width};padding:2px 2px;border:1px solid ${EMAIL_TABLE_LINE};text-align:${c.align};color:${EMAIL_TABLE_TEXT};font-size:7px;text-transform:uppercase;letter-spacing:0.01em;vertical-align:top;">${c.label}</th>`,
  ).join("");

  const rows = invoice.lineItems
    .map(
      (li) => `
      <tr>
        <td style="${emailCellStyle().replace("white-space:nowrap;", "white-space:normal;")}">${escapeHtml(li.product)}</td>
        <td style="${emailCellStyle()}">${escapeHtml(invoice.invoiceNo)}</td>
        <td style="${emailCellStyle()}">${formatDate(invoice.invoiceDate)}</td>
        <td style="${emailCellStyle()}">${formatDate(invoice.dueDate)}</td>
        <td style="${emailCellStyle("center")}">${li.qty}</td>
        <td style="${emailCellStyle("right")}">${money(li.rateCents)}</td>
        <td style="${emailCellStyle("right")}">${money(li.amountCents)}</td>
      </tr>`,
    )
    .join("");

  const paymentDetails =
    company.bankName || company.routingNumber || company.accountNumber
      ? `
    <div style="padding:0 12px 12px;text-align:center;">
      <p style="margin:0;font-size:10px;line-height:1.6;color:#57503f;background:#fbf0d9;border-radius:6px;padding:8px 10px;">
        <strong>Payment details</strong>
        ${company.bankName ? `<br/>Bank: ${escapeHtml(company.bankName)}` : ""}
        ${company.routingNumber ? `<br/>Routing number: ${escapeHtml(company.routingNumber)}` : ""}
        ${company.accountNumber ? `<br/>Account number: ${escapeHtml(company.accountNumber)}` : ""}
      </p>
    </div>`
      : "";

  return `
  <div style="width:100%;max-width:620px;margin:0 auto;box-sizing:border-box;background:#ffffff;border:1px solid #ece4d6;border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:${EMAIL_TABLE_TEXT};">
    <div style="padding:14px 12px 10px;text-align:center;">
      ${
        logoUrl
          ? `<img src="${logoUrl}" alt="${escapeHtml(company.companyName)}" style="max-height:56px;max-width:190px;" />`
          : `<strong style="font-size:14px;">${escapeHtml(company.companyName)}</strong>`
      }
    </div>
    <div style="background:#fbf0d9;padding:14px 12px 16px;text-align:center;">
      <h3 style="margin:0 0 8px;font-size:15px;">Your invoice is ready!</h3>
      <p style="margin:0;font-size:9px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#8a7550;">
        Balance due
      </p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:800;">${money(invoice.totals.totalCents)}</p>
      <p style="margin:6px 0 0;font-size:10px;color:#8a7550;">
        0% APR* or as low as ${estimateMonthly(invoice.totals.totalCents)}/mo with Affirm.
      </p>
    </div>
    <div style="padding:12px 4px 14px;overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:8px;color:${EMAIL_TABLE_TEXT};">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:0 12px 12px;text-align:center;">
      <p style="margin:0;font-size:12px;line-height:1.6;">
        Dear ${escapeHtml(billTo)},<br/>
        ${escapeHtml(company.companyName)} has sent you invoice <strong>${escapeHtml(invoice.invoiceNo)}</strong>
        for <strong>${money(invoice.totals.totalCents)}</strong>, due ${formatDate(invoice.dueDate)}.
        If you already paid this invoice or have any questions, let us know!
      </p>
      <p style="margin:10px 0 0;font-size:12px;">
        Have a great day!<br/>
        ${escapeHtml(company.companyName)}
      </p>
    </div>
    ${paymentDetails}
    <div style="background:#fbf0d9;padding:10px 12px;text-align:center;">
      <p style="margin:0;font-size:10px;line-height:1.6;color:#57503f;">
        <strong>${escapeHtml(company.companyName)}</strong>
        ${companyAddress ? `<br/>${escapeHtml(companyAddress)}` : ""}
      </p>
    </div>
  </div>`;
}

/**
 * Sends the actual "your invoice is ready" email when staff submit an
 * invoice (the compose modal in `InvoiceActions.tsx` / `InvoiceForm.tsx` —
 * `EmailPreview` there renders the exact same template `buildInvoiceEmailHtml`
 * builds here, so what's previewed before hitting "Confirm and submit" is
 * byte-for-byte what actually lands in the customer's inbox). CC/BCC come
 * from the customer record. Note the "Message" field in that compose modal
 * is NOT part of this email body — matching the original design, it's only
 * saved as the invoice's `noteToCustomer` and shown on the `/pay/[token]`
 * page instead.
 *
 * Fails loudly rather than silently no-op'ing like the contact form: if
 * this returns an error, the transition route does NOT mark the invoice
 * submitted — better to leave it in "approved" than to tell staff a
 * customer was notified when they weren't.
 */
export async function sendInvoiceSubmittedEmail(
  invoice: Invoice,
  company: CompanyProfile,
  subject: string,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = company.emailFrom || process.env.INVOICE_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      ok: false,
      error: "Email isn't configured yet — set RESEND_API_KEY and INVOICE_FROM_EMAIL.",
    };
  }
  if (!invoice.customer.primaryEmail) {
    return { ok: false, error: "This customer has no email address on file." };
  }

  const cc = [...splitEmails(invoice.customer.cc), ...splitEmails(invoice.customer.secondaryEmail)];
  const bcc = splitEmails(invoice.customer.bcc);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: invoice.customer.primaryEmail,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject,
      html: buildInvoiceEmailHtml(invoice, company),
    });

    if (error) {
      console.error("[invoice-submit] Resend API error:", error);
      return { ok: false, error: "Failed to send the invoice email." };
    }
    return { ok: true };
  } catch (err) {
    console.error("[invoice-submit] Unexpected error sending email:", err);
    return { ok: false, error: "Unexpected error sending the invoice email." };
  }
}

function daysOverdue(dueDate: string): number {
  const due = new Date(`${dueDate}T00:00:00Z`).getTime();
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z").getTime();
  return Math.max(0, Math.round((today - due) / (1000 * 60 * 60 * 24)));
}

/**
 * Payment-reminder email HTML — "PAYMENT REMINDER" cream band, "Follow-up
 * #N" heading, a per-line-item overdue-invoice table, then a plain-text
 * follow-up note and signature. A distinct template from
 * `buildInvoiceEmailHtml` (the "your invoice is ready" send) — reminders
 * are about an *already-sent, still-unpaid* invoice, not a new one.
 */
function buildReminderEmailHtml(invoice: Invoice, company: CompanyProfile, followupNumber: number): string {
  const overdue = daysOverdue(invoice.dueDate);
  const companyAddress = [
    company.addressLine1,
    company.addressLine2,
    [[company.city, company.state].filter(Boolean).join(", "), company.postalCode]
      .filter(Boolean)
      .join(" ")
      .trim() || null,
    company.country,
  ]
    .filter((s): s is string => Boolean(s && s.trim()))
    .join(", ");

  // Widths here are hints for the table's default auto layout, not a hard
  // cap — see the matching comment on `EMAIL_TABLE_COLS` in
  // `buildInvoiceEmailHtml` for why `table-layout:fixed` was tried and
  // reverted (it silently truncated values and fragmented header words
  // once a column's real-world width was a hair too tight). Only headers
  // and Employee wrap; the rest of the row stays `nowrap`. The wrapping
  // `<div>` still gets `overflow-x:auto` as a last-resort fallback.
  const reminderCols = [
    { label: "Employee", align: "left", width: "14%" },
    { label: "Invoice No.", align: "left", width: "14%" },
    { label: "Invoice Date", align: "left", width: "21%" },
    { label: "Due Date", align: "left", width: "21%" },
    { label: "Days Overdue", align: "center", width: "13%" },
    { label: "Invoice Amount ($)", align: "right", width: "17%" },
  ] as const;
  const reminderCellStyle = (align: "left" | "center" | "right" = "left"): string =>
    `padding:2px 2px;border:1px solid #000000;text-align:${align};vertical-align:top;`;

  const rows = invoice.lineItems
    .map(
      (li) => `
      <tr>
        <td style="${reminderCellStyle()}">${escapeHtml(li.product)}</td>
        <td style="${reminderCellStyle()}white-space:nowrap;">${escapeHtml(invoice.invoiceNo)}</td>
        <td style="${reminderCellStyle()}white-space:nowrap;">${formatDate(invoice.invoiceDate)}</td>
        <td style="${reminderCellStyle()}white-space:nowrap;">${formatDate(invoice.dueDate)}</td>
        <td style="${reminderCellStyle("center")}white-space:nowrap;">${overdue}</td>
        <td style="${reminderCellStyle("right")}white-space:nowrap;">${money(li.amountCents)}</td>
      </tr>`,
    )
    .join("");

  const headerCells = reminderCols
    .map(
      (c) =>
        `<th style="width:${c.width};padding:2px 2px;border:1px solid #000000;text-align:${c.align};font-size:7px;text-transform:uppercase;letter-spacing:0.01em;vertical-align:top;">${c.label}</th>`,
    )
    .join("");

  const fromLine = company.emailFrom || company.email || "";
  const logoUrl = company.logoUrl ? `${siteUrl()}${company.logoUrl}` : null;

  return `
  <div style="width:100%;max-width:620px;margin:0 auto;box-sizing:border-box;background:#ffffff;border:1px solid #ece4d6;border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="padding:14px 12px 8px;text-align:center;">
      ${
        logoUrl
          ? `<img src="${logoUrl}" alt="${escapeHtml(company.companyName)}" style="max-height:52px;max-width:180px;" />`
          : `<strong style="font-size:14px;">${escapeHtml(company.companyName)}</strong>`
      }
    </div>
    <div style="background:#fbf0d9;padding:14px 12px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488;">
        Payment reminder
      </p>
      <h3 style="margin:0;font-size:16px;">Follow-up #${followupNumber}</h3>
      <p style="margin:3px 0 0;font-size:12px;color:#57503f;">on Pending Payment</p>
    </div>
    <div style="padding:14px 12px;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 10px;">Hi Team,</p>
      <p style="margin:0 0 10px;">I hope you are doing well.</p>
      <p style="margin:0 0 10px;">I am writing to follow up on the payment status of the below invoice:</p>
      <div style="overflow-x:auto;margin:0 -12px;">
        <table style="width:100%;border-collapse:collapse;font-size:8px;margin:10px 0;">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p style="margin:10px 0;">
        The invoice is now <strong>${overdue} days</strong> past its due date, and we have not yet
        received the payment or an update regarding its status.
      </p>
      <p style="margin:10px 0;">
        Could you please provide us with an update on this payment? If the payment has already been
        processed, kindly share the remittance advice or payment confirmation for our records.
      </p>
      <p style="margin:10px 0;">Your prompt response would be greatly appreciated.</p>
      <p style="margin:16px 0 0;">
        Regards<br/>
        <strong>${escapeHtml(company.companyName)}</strong><br/>
        ${fromLine ? `<a href="mailto:${escapeHtml(fromLine)}" style="color:#1d5bd6;">${escapeHtml(fromLine)}</a><br/>` : ""}
        ${companyAddress ? escapeHtml(companyAddress) : ""}
      </p>
    </div>
  </div>`;
}

/**
 * Sends a payment-reminder ("Follow-up #N") email for an overdue,
 * already-submitted invoice. Callers (the `/remind` route) are responsible
 * for only allowing this while the invoice is unpaid — once marked paid,
 * there's nothing here stopping a call, so the gate belongs at the route/
 * DB level, not silently inside the email function.
 */
export async function sendPaymentReminderEmail(
  invoice: Invoice,
  company: CompanyProfile,
  followupNumber: number,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = company.emailFrom || process.env.INVOICE_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      ok: false,
      error: "Email isn't configured yet — set RESEND_API_KEY and INVOICE_FROM_EMAIL.",
    };
  }
  if (!invoice.customer.primaryEmail) {
    return { ok: false, error: "This customer has no email address on file." };
  }

  const cc = [...splitEmails(invoice.customer.cc), ...splitEmails(invoice.customer.secondaryEmail)];
  const bcc = splitEmails(invoice.customer.bcc);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: invoice.customer.primaryEmail,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject: `[FOLLOW-UP #${followupNumber}] Pending Payment — Invoice ${invoice.invoiceNo} (${invoice.customer.name})`,
      html: buildReminderEmailHtml(invoice, company, followupNumber),
    });

    if (error) {
      console.error("[invoice-remind] Resend API error:", error);
      return { ok: false, error: "Failed to send the reminder email." };
    }
    return { ok: true };
  } catch (err) {
    console.error("[invoice-remind] Unexpected error sending email:", err);
    return { ok: false, error: "Unexpected error sending the reminder email." };
  }
}
