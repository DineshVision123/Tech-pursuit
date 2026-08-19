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

/** Mirrors `InvoicePreview.tsx`'s `EMAIL_TABLE_COLS` exactly — widths are
 *  hints, not caps, same as there. */
const EMAIL_TABLE_COLS = [
  { label: "Employee", align: "left", width: "26%" },
  { label: "Invoice No.", align: "left", width: "14%" },
  { label: "Invoice Date", align: "left", width: "13%" },
  { label: "Due Date", align: "left", width: "13%" },
  { label: "Qty", align: "center", width: "7%" },
  { label: "Rate", align: "right", width: "11%" },
  { label: "Invoice Amount ($)", align: "right", width: "16%" },
] as const;

function emailCellStyle(align: "left" | "center" | "right" = "left"): string {
  return `padding:0.5rem 0.45rem;border:1px solid ${EMAIL_TABLE_LINE};text-align:${align};white-space:nowrap;`;
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
      `<th style="width:${c.width};padding:0.5rem 0.45rem;border:1px solid ${EMAIL_TABLE_LINE};text-align:${c.align};color:${EMAIL_TABLE_TEXT};font-size:0.65rem;text-transform:uppercase;letter-spacing:0.03em;">${c.label}</th>`,
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
    <div style="padding:0 1.75rem 1.5rem;text-align:center;">
      <p style="margin:0;font-size:0.78rem;line-height:1.7;color:#57503f;background:#fbf0d9;border-radius:8px;padding:0.9rem 1.1rem;">
        <strong>Payment details</strong>
        ${company.bankName ? `<br/>Bank: ${escapeHtml(company.bankName)}` : ""}
        ${company.routingNumber ? `<br/>Routing number: ${escapeHtml(company.routingNumber)}` : ""}
        ${company.accountNumber ? `<br/>Account number: ${escapeHtml(company.accountNumber)}` : ""}
      </p>
    </div>`
      : "";

  return `
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ece4d6;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:${EMAIL_TABLE_TEXT};">
    <div style="padding:1.5rem 1.75rem 1.1rem;text-align:center;">
      ${
        logoUrl
          ? `<img src="${logoUrl}" alt="${escapeHtml(company.companyName)}" style="max-height:88px;max-width:280px;" />`
          : `<strong style="font-size:1.05rem;">${escapeHtml(company.companyName)}</strong>`
      }
    </div>
    <div style="background:#fbf0d9;padding:1.4rem 1.75rem 1.6rem;text-align:center;">
      <h3 style="margin:0 0 0.9rem;font-size:1.15rem;">Your invoice is ready!</h3>
      <p style="margin:0;font-size:0.68rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#8a7550;">
        Balance due
      </p>
      <p style="margin:0.35rem 0 0;font-size:1.9rem;font-weight:800;">${money(invoice.totals.totalCents)}</p>
      <p style="margin:0.6rem 0 0;font-size:0.72rem;color:#8a7550;">
        0% APR* or as low as ${estimateMonthly(invoice.totals.totalCents)}/mo with Affirm.
      </p>
    </div>
    <div style="padding:1.3rem 1.75rem 1.45rem;">
      <table style="width:100%;border-collapse:collapse;font-size:0.78rem;color:${EMAIL_TABLE_TEXT};">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="padding:0 1.75rem 1.55rem;text-align:center;">
      <p style="margin:0;font-size:0.85rem;line-height:1.7;">
        Dear ${escapeHtml(billTo)},<br/>
        ${escapeHtml(company.companyName)} has sent you invoice <strong>${escapeHtml(invoice.invoiceNo)}</strong>
        for <strong>${money(invoice.totals.totalCents)}</strong>, due ${formatDate(invoice.dueDate)}.
        If you already paid this invoice or have any questions, let us know!
      </p>
      <p style="margin:1rem 0 0;font-size:0.85rem;">
        Have a great day!<br/>
        ${escapeHtml(company.companyName)}
      </p>
    </div>
    ${paymentDetails}
    <div style="background:#fbf0d9;padding:1.1rem 1.75rem;text-align:center;">
      <p style="margin:0;font-size:0.72rem;line-height:1.7;color:#57503f;">
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

  const rows = invoice.lineItems
    .map(
      (li) => `
      <tr>
        <td style="padding:0.5rem 0.6rem;border:1px solid #000000;">${escapeHtml(li.product)}</td>
        <td style="padding:0.5rem 0.6rem;border:1px solid #000000;">${escapeHtml(invoice.invoiceNo)}</td>
        <td style="padding:0.5rem 0.6rem;border:1px solid #000000;">${formatDate(invoice.invoiceDate)}</td>
        <td style="padding:0.5rem 0.6rem;border:1px solid #000000;">${formatDate(invoice.dueDate)}</td>
        <td style="padding:0.5rem 0.6rem;border:1px solid #000000;text-align:center;">${overdue}</td>
        <td style="padding:0.5rem 0.6rem;border:1px solid #000000;text-align:right;white-space:nowrap;">${money(li.amountCents)}</td>
      </tr>`,
    )
    .join("");

  const headerCols = [
    { label: "Employee", align: "left" },
    { label: "Invoice No.", align: "left" },
    { label: "Invoice Date", align: "left" },
    { label: "Due Date", align: "left" },
    { label: "Days Overdue", align: "center" },
    { label: "Invoice Amount ($)", align: "right" },
  ];
  const headerCells = headerCols
    .map(
      (c) =>
        `<th style="padding:0.5rem 0.6rem;border:1px solid #000000;text-align:${c.align};font-size:0.7rem;text-transform:uppercase;letter-spacing:0.03em;">${c.label}</th>`,
    )
    .join("");

  const fromLine = company.emailFrom || company.email || "";
  const logoUrl = company.logoUrl ? `${siteUrl()}${company.logoUrl}` : null;

  return `
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ece4d6;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="padding:1.5rem 1.75rem 1rem;text-align:center;">
      ${
        logoUrl
          ? `<img src="${logoUrl}" alt="${escapeHtml(company.companyName)}" style="max-height:80px;max-width:260px;" />`
          : `<strong style="font-size:1.05rem;">${escapeHtml(company.companyName)}</strong>`
      }
    </div>
    <div style="background:#fbf0d9;padding:1.4rem 1.75rem;">
      <p style="margin:0 0 0.4rem;font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488;">
        Payment reminder
      </p>
      <h3 style="margin:0;font-size:1.4rem;">Follow-up #${followupNumber}</h3>
      <p style="margin:0.25rem 0 0;font-size:1rem;color:#57503f;">on Pending Payment</p>
    </div>
    <div style="padding:1.5rem 1.75rem;">
      <p style="margin:0 0 0.9rem;">Hi Team,</p>
      <p style="margin:0 0 0.9rem;">I hope you are doing well.</p>
      <p style="margin:0 0 0.9rem;">I am writing to follow up on the payment status of the below invoice:</p>
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin:1rem 0;">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:0.9rem 0;">
        The invoice is now <strong>${overdue} days</strong> past its due date, and we have not yet
        received the payment or an update regarding its status.
      </p>
      <p style="margin:0.9rem 0;">
        Could you please provide us with an update on this payment? If the payment has already been
        processed, kindly share the remittance advice or payment confirmation for our records.
      </p>
      <p style="margin:0.9rem 0;">Your prompt response would be greatly appreciated.</p>
      <p style="margin:1.5rem 0 0;">
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
