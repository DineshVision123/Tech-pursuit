import "server-only";
import { jsPDF } from "jspdf";
import { displayNameWithParent, formatDate, money, TERM_LABEL } from "./format";
import type { Address, CompanyProfile, Invoice } from "./types";

/**
 * Server-side invoice PDF — attached to the "your invoice is ready" email.
 *
 * The on-page Download button (`lib/portal/pdf.ts`) rasterizes the rendered
 * `InvoiceDocument` DOM in the browser, which isn't available when the email
 * goes out from the server. So this draws the same document — letterhead,
 * Bill to/Ship to, invoice details, line items, totals, payment details and
 * notes, in the same order — directly with jsPDF. Keep the two in step:
 * a section added to `InvoiceDocument` belongs here too.
 *
 * Unlike the single-page shrink-to-fit download, long invoices flow onto
 * extra pages (table header repeated) so text stays a readable size.
 */

const PAGE_MARGIN = 40;
const TEXT: RGB = [16, 21, 43]; // --portal-text
const TEXT_2: RGB = [75, 84, 104]; // --portal-text-2
const TEXT_3: RGB = [128, 138, 163]; // --portal-text-3
const BORDER: RGB = [230, 231, 242]; // --portal-border

type RGB = [number, number, number];

export interface CompanyLogo {
  readonly bytes: Buffer;
  readonly mime: string;
}

/** Same two-to-four lines `InvoicePreview.tsx`'s `addressLines` renders. */
function addressLines(a: Address): string[] {
  const cityStateZip = [a.city, a.state].filter(Boolean).join(", ");
  return [a.line1, a.line2, [cityStateZip, a.postalCode].filter(Boolean).join(" "), a.country].filter(
    (s): s is string => Boolean(s && s.trim()),
  );
}

/** jsPDF's built-in Helvetica only covers WinAnsi — drop characters it can't
 *  encode (emoji etc.) instead of letting them render as garbage glyphs. */
function clean(s: string): string {
  return s.replace(/[^\x09\x0a\x0d\x20-\x7e -ÿ–—‘’“”•…€]/g, "");
}

export function renderInvoicePdf(
  invoice: Invoice,
  company: CompanyProfile,
  logo: CompanyLogo | null,
): Buffer {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  // Multi-line `text()` calls step by fontSize × this; the hand-advanced `y`
  // math below assumes the same factor.
  const LINE_FACTOR = 1.2;
  pdf.setLineHeightFactor(LINE_FACTOR);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = PAGE_MARGIN;
  const right = pageWidth - PAGE_MARGIN;
  const contentWidth = right - left;
  const bottom = pageHeight - PAGE_MARGIN - 14; // room for the page footer
  let y = PAGE_MARGIN;

  const setText = (size: number, color: RGB, style: "normal" | "bold" = "normal") => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };
  const rule = (atY: number) => {
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.75);
    pdf.line(left, atY, right, atY);
  };
  const label = (text: string, x: number, atY: number, align: "left" | "right" = "left") => {
    setText(7, TEXT_3, "bold");
    pdf.text(text.toUpperCase(), x, atY, { align, charSpace: 0.4 });
  };
  /** Starts a new page when `needed` points won't fit; returns true if it did. */
  const ensureRoom = (needed: number): boolean => {
    if (y + needed <= bottom) return false;
    pdf.addPage();
    y = PAGE_MARGIN;
    return true;
  };

  // ---- Letterhead -----------------------------------------------------------

  let logoBottom = y;
  if (logo && (logo.mime === "image/png" || logo.mime === "image/jpeg" || logo.mime === "image/jpg")) {
    try {
      const data = new Uint8Array(logo.bytes);
      const format = logo.mime === "image/png" ? "PNG" : "JPEG";
      const props = pdf.getImageProperties(data);
      const scale = Math.min(150 / props.width, 48 / props.height, 1);
      const w = props.width * scale;
      const h = props.height * scale;
      pdf.addImage(data, format, right - w, y, w, h);
      logoBottom = y + h;
    } catch (err) {
      // A logo the PDF encoder can't read shouldn't block the invoice email.
      console.error("[invoice-pdf] Could not embed company logo:", err);
    }
  }

  const headTextWidth = contentWidth - 170;
  label("Invoice", left, y + 7);
  y += 22;
  setText(12, TEXT, "bold");
  pdf.text(clean(company.companyName), left, y, { maxWidth: headTextWidth });
  y += 14;

  const companyLines = [
    company.addressLine1,
    company.addressLine2,
    [[company.city, company.state].filter(Boolean).join(", "), company.postalCode]
      .filter(Boolean)
      .join(" ")
      .trim() || null,
    company.country,
  ].filter((s): s is string => Boolean(s && s.trim()));
  setText(8.5, TEXT_3);
  for (const line of companyLines) {
    pdf.text(clean(line), left, y, { maxWidth: headTextWidth });
    y += 11;
  }
  const contact = [company.email, company.phone, company.website].filter((s): s is string =>
    Boolean(s && s.trim()),
  );
  if (contact.length > 0) {
    y += 4;
    setText(8, TEXT_3);
    const contactLines = pdf.splitTextToSize(clean(contact.join("     ")), headTextWidth) as string[];
    pdf.text(contactLines, left, y);
    y += contactLines.length * 8 * LINE_FACTOR;
  }

  y = Math.max(y, logoBottom + 6) + 8;
  rule(y);
  y += 20;

  // ---- Bill to / Ship to ----------------------------------------------------

  const customerName = displayNameWithParent(invoice.customer);
  const billToName = invoice.customer.company ?? customerName;
  const colWidth = contentWidth / 2 - 12;
  const shipX = left + contentWidth / 2 + 12;

  const drawBlock = (x: number, title: string, lines: { text: string; strong?: boolean }[]): number => {
    let by = y;
    label(title, x, by);
    by += 14;
    for (const line of lines) {
      if (line.strong) setText(10, TEXT, "bold");
      else setText(8.5, TEXT_3);
      const wrapped = pdf.splitTextToSize(clean(line.text), colWidth) as string[];
      pdf.text(wrapped, x, by);
      by += (wrapped.length - 1) * (line.strong ? 10 : 8.5) * LINE_FACTOR + (line.strong ? 13 : 11);
    }
    return by;
  };

  const billLines: { text: string; strong?: boolean }[] = [{ text: billToName, strong: true }];
  if (invoice.customer.company) billLines.push({ text: customerName });
  if (invoice.customer.billingAddress) {
    billLines.push(...addressLines(invoice.customer.billingAddress).map((text) => ({ text })));
  }
  const shipLines: { text: string; strong?: boolean }[] = invoice.customer.shippingAddress
    ? [
        { text: billToName, strong: true },
        ...addressLines(invoice.customer.shippingAddress).map((text) => ({ text })),
      ]
    : [{ text: "Same as billing" }];

  y = Math.max(drawBlock(left, "Bill to", billLines), drawBlock(shipX, "Ship to", shipLines)) + 10;

  // ---- Invoice details ------------------------------------------------------

  rule(y);
  y += 18;
  const termLabel =
    invoice.term === "custom" ? (invoice.customTermLabel ?? TERM_LABEL.custom) : TERM_LABEL[invoice.term];
  const details: [string, string][] = [
    ["Invoice no.", invoice.invoiceNo],
    ["Terms", termLabel],
    ["Invoice date", formatDate(invoice.invoiceDate)],
    ["Due date", formatDate(invoice.dueDate)],
  ];
  let dx = left;
  for (const [title, value] of details) {
    label(title, dx, y);
    setText(10, TEXT, "bold");
    pdf.text(clean(value), dx, y + 14);
    dx += Math.max(pdf.getTextWidth(clean(value)), 60) + 36;
  }
  y += 26;
  rule(y);
  y += 22;

  // ---- Line items -----------------------------------------------------------

  const cols = [
    { key: "n", title: "#", width: 22, align: "left" },
    { key: "product", title: "Employee name", width: 124, align: "left" },
    { key: "month", title: "Month", width: 62, align: "left" },
    { key: "description", title: "Description", width: 0, align: "left" }, // takes the rest
    { key: "qty", title: "Qty", width: 40, align: "right" },
    { key: "rate", title: "Rate", width: 68, align: "right" },
    { key: "amount", title: "Amount", width: 76, align: "right" },
  ] as const;
  const fixed = cols.reduce((sum, c) => sum + c.width, 0);
  const widths = cols.map((c) => (c.width === 0 ? contentWidth - fixed : c.width));
  const xs = widths.map((_, i) => left + widths.slice(0, i).reduce((a, b) => a + b, 0));
  const CELL_PAD = 4;

  const drawTableHeader = () => {
    cols.forEach((c, i) => {
      const x = c.align === "right" ? xs[i] + widths[i] - CELL_PAD : xs[i] + (i === 0 ? 0 : CELL_PAD);
      label(c.title, x, y, c.align);
    });
    y += 6;
    rule(y);
    y += 14;
  };
  drawTableHeader();

  invoice.lineItems.forEach((li, index) => {
    const cell = (i: number) => widths[i] - CELL_PAD * 2;
    setText(9, TEXT, "bold");
    const productLines = pdf.splitTextToSize(clean(li.product), cell(1)) as string[];
    setText(9, TEXT_3);
    const monthLines = pdf.splitTextToSize(clean(li.month ?? ""), cell(2)) as string[];
    const descLines = pdf.splitTextToSize(clean(li.description ?? ""), cell(3)) as string[];
    const rowLines = Math.max(productLines.length, monthLines.length, descLines.length, 1);
    const lineStep = 9 * LINE_FACTOR;
    // Baseline of the last wrapped line, plus room for descenders.
    const textBottom = (rowLines - 1) * lineStep + 7;

    if (ensureRoom(textBottom + 14)) drawTableHeader();

    setText(9, TEXT_3);
    pdf.text(String(index + 1), xs[0], y);
    setText(9, TEXT, "bold");
    pdf.text(productLines, xs[1] + CELL_PAD, y);
    setText(9, TEXT_3);
    pdf.text(monthLines, xs[2] + CELL_PAD, y);
    pdf.text(descLines, xs[3] + CELL_PAD, y);
    setText(9, TEXT);
    pdf.text(String(li.qty), xs[4] + widths[4] - CELL_PAD, y, { align: "right" });
    pdf.text(money(li.rateCents), xs[5] + widths[5] - CELL_PAD, y, { align: "right" });
    setText(9, TEXT, "bold");
    pdf.text(money(li.amountCents), xs[6] + widths[6] - CELL_PAD, y, { align: "right" });

    y += textBottom;
    rule(y);
    y += 15;
  });

  // ---- Totals ---------------------------------------------------------------

  ensureRoom(70);
  y += 6;
  const totalsLeft = right - 220;
  const sumRow = (title: string, value: string) => {
    setText(9.5, TEXT_2);
    pdf.text(title, totalsLeft, y);
    setText(9.5, TEXT);
    pdf.text(value, right, y, { align: "right" });
    y += 16;
  };
  sumRow("Subtotal", money(invoice.totals.subtotalCents));
  sumRow(`Sales tax (${invoice.salesTaxPct}%)`, money(invoice.totals.salesTaxCents));
  pdf.setDrawColor(...BORDER);
  pdf.line(totalsLeft, y - 6, right, y - 6);
  y += 10;
  setText(14, TEXT, "bold");
  pdf.text("Total", totalsLeft, y);
  pdf.text(money(invoice.totals.totalCents), right, y, { align: "right" });
  y += 18;

  // ---- Payment details / instructions / note --------------------------------

  const bankLines = [
    company.bankName ? `Bank: ${company.bankName}` : null,
    company.routingNumber ? `Routing number: ${company.routingNumber}` : null,
    company.accountNumber ? `Account number: ${company.accountNumber}` : null,
  ].filter((s): s is string => s !== null);
  const notes: [string, string][] = [];
  if (bankLines.length > 0) notes.push(["Payment details", bankLines.join("\n")]);
  if (invoice.paymentInstructions) notes.push(["Payment instructions", invoice.paymentInstructions]);
  if (invoice.noteToCustomer) notes.push(["Note", invoice.noteToCustomer]);

  if (notes.length > 0) {
    ensureRoom(40);
    y += 8;
    rule(y);
    y += 20;
    for (const [title, body] of notes) {
      setText(9.5, TEXT_2);
      const lines = pdf.splitTextToSize(clean(body), contentWidth) as string[];
      const bodyHeight = lines.length * 9.5 * LINE_FACTOR;
      ensureRoom(14 + bodyHeight);
      label(title, left, y);
      y += 13;
      setText(9.5, TEXT_2);
      pdf.text(lines, left, y);
      y += bodyHeight + 8;
    }
  }

  // ---- Footer (page numbers, only when it actually ran onto more pages) -----

  const pages = pdf.getNumberOfPages();
  if (pages > 1) {
    for (let p = 1; p <= pages; p++) {
      pdf.setPage(p);
      setText(7.5, TEXT_3);
      pdf.text(`${invoice.invoiceNo} · Page ${p} of ${pages}`, right, pageHeight - PAGE_MARGIN + 6, {
        align: "right",
      });
    }
  }

  return Buffer.from(pdf.output("arraybuffer"));
}
