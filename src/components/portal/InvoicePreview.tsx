import type { CSSProperties } from "react";
import { Mail, CreditCard, FileText } from "lucide-react";
import { money, formatDate } from "@/lib/portal/format";
import type { Address } from "@/lib/portal/types";

/**
 * Live preview of the invoice-in-progress through three lenses (same pattern
 * as QuickBooks Online's Email/Payor/PDF invoice tabs) — one draft, three
 * renderings: a compact email teaser, the customer-facing "pay this invoice"
 * page, and the formal printable document. All three read straight off the
 * in-progress form state, no save required.
 */

export type PreviewTab = "edit" | "email" | "payor" | "pdf";

export interface InvoiceDraftLine {
  readonly product: string;
  /** Timesheet month this line bills for, e.g. "July" — null if unset. */
  readonly month: string | null;
  readonly description: string;
  readonly qty: number;
  readonly rateCents: number;
  readonly amountCents: number;
}

/** The letterhead — see `lib/api.ts`'s `getCompanyProfile`/`companyLogoSrc`.
 *  `logoSrc` is a ready-to-use image `src` (already made absolute by the
 *  caller), not the API's relative `logoUrl` — keeps this component free of
 *  any knowledge of the API origin. */
export interface InvoiceDraftCompany {
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly website: string | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly state: string | null;
  readonly postalCode: string | null;
  readonly country: string | null;
  readonly logoSrc: string | null;
  /** The real configured sender identity — the submit compose step's
   *  read-only "From" field. */
  readonly emailFrom: string | null;
  /** Wire/ACH remittance details, shown on the PDF and invoice-ready email. */
  readonly bankName: string | null;
  readonly routingNumber: string | null;
  readonly accountNumber: string | null;
}

export interface InvoiceDraft {
  readonly invoiceNo: string;
  readonly company: InvoiceDraftCompany;
  readonly customerName: string;
  readonly customerCompany: string | null;
  readonly customerEmail: string;
  readonly customerBillingAddress: Address | null;
  readonly customerShippingAddress: Address | null;
  readonly invoiceDate: string;
  readonly dueDate: string;
  readonly termLabel: string;
  readonly lineItems: readonly InvoiceDraftLine[];
  readonly subtotalCents: number;
  readonly taxCents: number;
  readonly totalCents: number;
  readonly salesTaxPct: number;
  readonly note: string;
  readonly paymentInstructions: string;
}

/** Two lines: street + (city, state postalCode) — country is included only
 *  when the reader might not assume it (kept off the compact renders). */
function addressLines(a: Address): string[] {
  const cityStateZip = [a.city, a.state].filter(Boolean).join(", ");
  return [
    a.line1,
    a.line2,
    [cityStateZip, a.postalCode].filter(Boolean).join(" "),
    a.country,
  ].filter((s): s is string => Boolean(s && s.trim()));
}

export function InvoicePreview({
  view,
  draft,
}: {
  readonly view: Exclude<PreviewTab, "edit">;
  readonly draft: InvoiceDraft;
}) {
  if (view === "email") return <EmailPreview draft={draft} />;
  if (view === "payor") return <PayorPreview draft={draft} />;
  return <PdfPreview draft={draft} />;
}

/** Same rough "as low as $X/mo" estimate as the backend's
 *  `estimateMonthlyCents` — illustrative only, not a real financing quote. */
function estimateMonthly(totalCents: number): string {
  return money(Math.round(totalCents / 24));
}

/** The table is the one un-branded element in the email — a plain black-ruled
 *  grid, no cream fill behind the header. Mirrors `invoice-email-service.ts`. */
const EMAIL_TABLE_LINE = "#000000";
const EMAIL_TABLE_TEXT = "#111827";

/** Widths mirror `invoice-email-service.ts`'s `TABLE_COLS` — hints, not caps:
 *  the nowrap value columns claim their intrinsic width first and the slack
 *  goes to Employee rather than the long "Invoice Amount ($)" header. */
const EMAIL_TABLE_COLS = [
  { label: "Employee", align: "left", width: "26%" },
  { label: "Invoice No.", align: "left", width: "14%" },
  { label: "Invoice Date", align: "left", width: "13%" },
  { label: "Due Date", align: "left", width: "13%" },
  { label: "Qty", align: "center", width: "7%" },
  { label: "Rate", align: "right", width: "11%" },
  { label: "Invoice Amount ($)", align: "right", width: "16%" },
] as const;

/** Fixed-format values never wrap — an invoice no. or date split across two
 *  lines reads as two separate values. Headers and the variable-length
 *  employee name still wrap; they're the table's only pressure-release. */
function emailCell(align: "left" | "center" | "right" = "left"): CSSProperties {
  return {
    padding: "0.5rem 0.45rem",
    border: `1px solid ${EMAIL_TABLE_LINE}`,
    textAlign: align,
    whiteSpace: "nowrap",
  };
}

/** Mirrors the real HTML email `invoice-email-service.ts` sends (Resend) —
 *  same cream bands and Affirm teaser, no CTA button or payment badges — so
 *  what you preview here is what actually lands in the customer's inbox. */
function EmailPreview({ draft }: { readonly draft: InvoiceDraft }) {
  const billTo = draft.customerCompany || draft.customerName;
  const companyAddress = [
    draft.company.addressLine1,
    draft.company.addressLine2,
    [[draft.company.city, draft.company.state].filter(Boolean).join(", "), draft.company.postalCode]
      .filter(Boolean)
      .join(" ")
      .trim() || null,
    draft.company.country,
  ]
    .filter((s): s is string => Boolean(s && s.trim()))
    .join(", ");

  return (
    <section className="card pad">
      <div className="row" style={{ gap: "0.5rem", marginBottom: "1rem" }}>
        <Mail size={16} className="muted-3" />
        <span className="muted-3" style={{ fontSize: "0.78rem" }}>
          Preview — this is what actually gets sent when the invoice is created
        </span>
      </div>
      <div
        className="rounded-xl"
        style={{
          maxWidth: 620,
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #ece4d6",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "1.5rem 1.75rem 1.1rem", textAlign: "center" }}>
          {draft.company.logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.company.logoSrc}
              alt={draft.company.name}
              // `margin:0 auto`, not the parent's `text-align:center` —
              // Tailwind's preflight makes `img` a block, which text-align
              // can't centre. The real email has no preflight, so its `<img>`
              // stays inline and its `<td align="center">` does the work.
              style={{ maxHeight: 88, maxWidth: 280, objectFit: "contain", margin: "0 auto" }}
            />
          ) : (
            <strong style={{ fontSize: "1.05rem" }}>{draft.company.name}</strong>
          )}
        </div>
        <div
          style={{ background: "#fbf0d9", padding: "1.4rem 1.75rem 1.6rem", textAlign: "center" }}
        >
          <h3 style={{ margin: "0 0 0.9rem", fontSize: "1.15rem" }}>Your invoice is ready!</h3>
          <p
            style={{
              margin: 0,
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#8a7550",
            }}
          >
            Balance due
          </p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "1.9rem", fontWeight: 800 }}>
            {money(draft.totalCents)}
          </p>
          <p style={{ margin: "0.6rem 0 0", fontSize: "0.72rem", color: "#8a7550" }}>
            0% APR* or as low as {estimateMonthly(draft.totalCents)}/mo with Affirm.
          </p>
        </div>
        {/* The white gap under the cream band is deliberate, and the email's
            table cell carries the matching `padding:24px 32px 26px`. These
            two numbers only mean anything as a pair — change one and the
            preview starts lying about what lands in the inbox. */}
        <div style={{ padding: "1.3rem 1.75rem 1.45rem", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.78rem",
              color: EMAIL_TABLE_TEXT,
            }}
          >
            <thead>
              <tr>
                {EMAIL_TABLE_COLS.map((c) => (
                  <th
                    key={c.label}
                    style={{
                      width: c.width,
                      padding: "0.5rem 0.45rem",
                      border: `1px solid ${EMAIL_TABLE_LINE}`,
                      textAlign: c.align,
                      color: EMAIL_TABLE_TEXT,
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draft.lineItems.map((li, i) => (
                <tr key={i}>
                  <td style={{ ...emailCell(), whiteSpace: "normal" }}>{li.product}</td>
                  <td style={emailCell()}>{draft.invoiceNo}</td>
                  <td style={emailCell()}>{formatDate(draft.invoiceDate)}</td>
                  <td style={emailCell()}>{formatDate(draft.dueDate)}</td>
                  <td className="tnum" style={emailCell("center")}>
                    {li.qty}
                  </td>
                  <td className="tnum" style={emailCell("right")}>
                    {money(li.rateCents)}
                  </td>
                  <td className="tnum" style={emailCell("right")}>
                    {money(li.amountCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "0 1.75rem 1.55rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.7 }}>
            Dear {billTo},
            <br />
            {draft.company.name} has sent you invoice <strong>{draft.invoiceNo}</strong> for{" "}
            <strong>{money(draft.totalCents)}</strong>, due {formatDate(draft.dueDate)}. If you
            already paid this invoice or have any questions, let us know!
          </p>
          <p style={{ margin: "1rem 0 0", fontSize: "0.85rem" }}>
            Have a great day!
            <br />
            {draft.company.name}
          </p>
        </div>
        {(draft.company.bankName || draft.company.routingNumber || draft.company.accountNumber) && (
          <div style={{ padding: "0 1.75rem 1.5rem", textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.78rem",
                lineHeight: 1.7,
                color: "#57503f",
                background: "#fbf0d9",
                borderRadius: 8,
                padding: "0.9rem 1.1rem",
              }}
            >
              <strong>Payment details</strong>
              {draft.company.bankName && (
                <>
                  <br />
                  Bank: {draft.company.bankName}
                </>
              )}
              {draft.company.routingNumber && (
                <>
                  <br />
                  Routing number: {draft.company.routingNumber}
                </>
              )}
              {draft.company.accountNumber && (
                <>
                  <br />
                  Account number: {draft.company.accountNumber}
                </>
              )}
            </p>
          </div>
        )}
        <div style={{ background: "#fbf0d9", padding: "1.1rem 1.75rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", lineHeight: 1.7, color: "#57503f" }}>
            <strong>{draft.company.name}</strong>
            {companyAddress && (
              <>
                <br />
                {companyAddress}
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

export function PayorPreview({
  draft,
  /** false on the real `/pay/[token]` page — that visitor IS the customer,
   *  so "here's what X sees" would read as talking about them in the third
   *  person on their own screen. True on the admin in-form preview tab. */
  isPreview = true,
}: {
  readonly draft: InvoiceDraft;
  readonly isPreview?: boolean;
}) {
  return (
    <section className="card pad">
      <div className="row" style={{ gap: "0.5rem", marginBottom: "1rem" }}>
        <CreditCard size={16} className="muted-3" />
        <span className="muted-3" style={{ fontSize: "0.78rem" }}>
          {isPreview
            ? `Preview — what ${draft.customerName || "the customer"} sees when they open the invoice link`
            : "Here's your invoice — review the details below."}
        </span>
      </div>
      <div className="surface rounded-xl p-6" style={{ border: "1px solid var(--portal-border)" }}>
        {draft.company.logoSrc && (
          <div style={{ textAlign: "center", marginBottom: "1.1rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={draft.company.logoSrc}
              alt={draft.company.name}
              // `margin:0 auto`, not the parent's `text-align:center` —
              // Tailwind's preflight makes `img` a block, which text-align
              // can't centre. The real email has no preflight, so its `<img>`
              // stays inline and its `<td align="center">` does the work.
              style={{ maxHeight: 88, maxWidth: 280, objectFit: "contain", margin: "0 auto" }}
            />
          </div>
        )}
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div>
            <div className="muted-3" style={{ fontSize: "0.75rem" }}>
              {draft.company.name}
            </div>
            <h3 style={{ margin: "0.25rem 0" }}>Invoice {draft.invoiceNo}</h3>
            <div className="muted-3" style={{ fontSize: "0.78rem" }}>
              Bill to {draft.customerCompany ?? draft.customerName}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="muted-3" style={{ fontSize: "0.75rem" }}>
              Amount due
            </div>
            <div className="tnum strong" style={{ fontSize: "1.3rem" }}>
              {money(draft.totalCents)}
            </div>
            <div className="muted-3" style={{ fontSize: "0.78rem" }}>
              Due {formatDate(draft.dueDate)}
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary full"
          type="button"
          disabled
          style={{ marginTop: "1.25rem" }}
        >
          Pay now
        </button>
        <p className="muted-3" style={{ fontSize: "0.72rem", marginTop: "0.4rem" }}>
          Online payment isn&apos;t configured yet — this button is illustrative.
        </p>

        <div className="sum-divider" style={{ margin: "1.25rem 0" }} />

        <table className="itable" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Employee name</th>
              <th>Month</th>
              <th className="right">Qty</th>
              <th className="right">Rate</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {draft.lineItems.map((li, i) => (
              <tr key={i}>
                <td>
                  <div>{li.product}</div>
                  {li.description && <small className="muted-3">{li.description}</small>}
                </td>
                <td className="muted-3">{li.month ?? ""}</td>
                <td className="right tnum">{li.qty}</td>
                <td className="right tnum">{money(li.rateCents)}</td>
                <td className="right tnum strong">{money(li.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="doc-totals" style={{ marginTop: "1rem" }}>
          <div className="sum-row">
            <span className="muted">Subtotal</span>
            <span className="tnum">{money(draft.subtotalCents)}</span>
          </div>
          <div className="sum-row">
            <span className="muted">Sales tax ({draft.salesTaxPct}%)</span>
            <span className="tnum">{money(draft.taxCents)}</span>
          </div>
          <div className="sum-divider" />
          <div className="sum-row sum-total">
            <span>Total</span>
            <span className="tnum">{money(draft.totalCents)}</span>
          </div>
        </div>

        {draft.note && (
          <p className="muted" style={{ marginTop: "1.25rem", fontSize: "0.85rem" }}>
            {draft.note}
          </p>
        )}
      </div>
    </section>
  );
}

function PdfPreview({ draft }: { readonly draft: InvoiceDraft }) {
  return (
    <section className="card pad pdf-preview-shell">
      <div className="row no-print" style={{ gap: "0.5rem", marginBottom: "1rem" }}>
        <FileText size={16} className="muted-3" />
        <span className="muted-3" style={{ fontSize: "0.78rem" }}>
          Preview — the formal document version, for printing or attaching
        </span>
      </div>
      <InvoiceDocument draft={draft} />
    </section>
  );
}

/**
 * The actual formal invoice document — letterhead, Bill to/Ship to, invoice
 * details, line items, totals. Shared by `PdfPreview` (the New/Edit review
 * screen) and the invoice detail page's own render, so a submitted
 * invoice's downloadable PDF (`DownloadInvoiceButton` rasterizes whichever
 * `.card.doc` is on the page) can never drift from what was shown during
 * "Review and submit" — same component, same markup, every time.
 */
export function InvoiceDocument({ draft }: { readonly draft: InvoiceDraft }) {
  const companyLines = [
    draft.company.addressLine1,
    draft.company.addressLine2,
    [[draft.company.city, draft.company.state].filter(Boolean).join(", "), draft.company.postalCode]
      .filter(Boolean)
      .join(" ")
      .trim() || null,
    draft.company.country,
  ].filter((s): s is string => Boolean(s && s.trim()));
  const companyContact = [draft.company.email, draft.company.phone, draft.company.website].filter(
    (s): s is string => Boolean(s && s.trim()),
  );

  return (
    <div className="card doc">
      <div className="doc-head">
        <div>
          <p className="doc-eyebrow">Invoice</p>
          <strong style={{ display: "block", fontSize: "0.95rem", marginTop: "0.15rem" }}>
            {draft.company.name}
          </strong>
          {companyLines.map((line) => (
            <div key={line} className="muted-3" style={{ fontSize: "0.8rem" }}>
              {line}
            </div>
          ))}
          {companyContact.length > 0 && (
            <div
              className="muted-3"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.9rem",
                fontSize: "0.78rem",
                marginTop: "0.6rem",
              }}
            >
              {companyContact.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          )}
        </div>
        {draft.company.logoSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={draft.company.logoSrc}
            alt={draft.company.name}
            style={{ maxHeight: 64, maxWidth: 200, objectFit: "contain" }}
          />
        )}
      </div>

      <div className="doc-meta">
        <div>
          <span className="label">Bill to</span>
          <strong>{draft.customerCompany ?? draft.customerName}</strong>
          {draft.customerCompany && (
            <div className="muted-3" style={{ fontSize: "0.8rem", marginTop: "0.15rem" }}>
              {draft.customerName}
            </div>
          )}
          {draft.customerBillingAddress &&
            addressLines(draft.customerBillingAddress).map((line) => (
              <div key={line} className="muted-3" style={{ fontSize: "0.8rem" }}>
                {line}
              </div>
            ))}
        </div>
        <div>
          <span className="label">Ship to</span>
          {draft.customerShippingAddress ? (
            <>
              <strong>{draft.customerCompany ?? draft.customerName}</strong>
              {addressLines(draft.customerShippingAddress).map((line) => (
                <div key={line} className="muted-3" style={{ fontSize: "0.8rem" }}>
                  {line}
                </div>
              ))}
            </>
          ) : (
            <span className="muted-3" style={{ fontSize: "0.8rem" }}>
              Same as billing
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.8rem",
          padding: "1rem 0 1.2rem",
          borderTop: "1px solid var(--portal-border)",
          borderBottom: "1px solid var(--portal-border)",
        }}
      >
        <div>
          <span className="label">Invoice no.</span>
          <strong>{draft.invoiceNo}</strong>
        </div>
        <div>
          <span className="label">Terms</span>
          <strong>{draft.termLabel}</strong>
        </div>
        <div>
          <span className="label">Invoice date</span>
          <strong>{formatDate(draft.invoiceDate)}</strong>
        </div>
        <div>
          <span className="label">Due date</span>
          <strong>{formatDate(draft.dueDate)}</strong>
        </div>
      </div>

      <div className="table-wrap">
        <table className="itable doc-lines">
          <thead>
            <tr>
              <th style={{ width: "2rem" }}>#</th>
              <th>Employee name</th>
              <th>Month</th>
              <th>Description</th>
              <th className="right">Qty</th>
              <th className="right">Rate</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {draft.lineItems.map((li, i) => (
              <tr key={i}>
                <td className="muted-3">{i + 1}</td>
                <td>
                  <strong>{li.product}</strong>
                </td>
                <td className="muted-3">{li.month ?? ""}</td>
                <td className="muted-3">{li.description}</td>
                <td className="right tnum">{li.qty}</td>
                <td className="right tnum">{money(li.rateCents)}</td>
                <td className="right tnum strong">{money(li.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="doc-totals">
        <div className="sum-row">
          <span className="muted">Subtotal</span>
          <span className="tnum">{money(draft.subtotalCents)}</span>
        </div>
        <div className="sum-row">
          <span className="muted">Sales tax ({draft.salesTaxPct}%)</span>
          <span className="tnum">{money(draft.taxCents)}</span>
        </div>
        <div className="sum-divider" />
        <div className="sum-row sum-total">
          <span>Total</span>
          <span className="tnum">{money(draft.totalCents)}</span>
        </div>
      </div>

      {(draft.company.bankName ||
        draft.company.routingNumber ||
        draft.company.accountNumber ||
        draft.note ||
        draft.paymentInstructions) && (
        <div className="doc-notes">
          {(draft.company.bankName ||
            draft.company.routingNumber ||
            draft.company.accountNumber) && (
            <p>
              <span className="label">Payment details</span>
              {draft.company.bankName && <>Bank: {draft.company.bankName}</>}
              {draft.company.routingNumber && (
                <>
                  {draft.company.bankName && <br />}
                  Routing number: {draft.company.routingNumber}
                </>
              )}
              {draft.company.accountNumber && (
                <>
                  <br />
                  Account number: {draft.company.accountNumber}
                </>
              )}
            </p>
          )}
          {draft.paymentInstructions && (
            <p>
              <span className="label">Payment instructions</span>
              {draft.paymentInstructions}
            </p>
          )}
          {draft.note && (
            <p>
              <span className="label">Note</span>
              {draft.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
