import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getInvoice, getAudit, getCompanyProfile } from "@/lib/portal/queries";
import { displayNameWithParent, TERM_LABEL } from "@/lib/portal/format";
import { ApiError } from "@/components/portal/ApiError";
import { LifecyclePipeline } from "@/components/portal/LifecyclePipeline";
import { InvoiceActions } from "@/components/portal/InvoiceActions";
import { InvoiceDocument, type InvoiceDraft } from "@/components/portal/InvoicePreview";
import { DownloadInvoiceButton } from "@/components/portal/DownloadInvoiceButton";
import { AuditTimeline } from "@/components/portal/AuditTimeline";
import { AttachmentList } from "@/components/portal/AttachmentList";
import { PayorLinkCard } from "@/components/portal/PayorLinkCard";
import { RevealItem } from "@/components/portal/Reveal";

const EDITABLE = new Set(["draft", "rejected"]);

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let invoice;
  let audit;
  let profile;
  try {
    [invoice, audit, profile] = await Promise.all([
      getInvoice(id),
      getAudit(id),
      getCompanyProfile(),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("not found") || msg.includes("404")) notFound();
    return <ApiError message={msg} />;
  }

  const editable = EDITABLE.has(invoice.status);
  const ccBccCount = Number(Boolean(invoice.customer.cc)) + Number(Boolean(invoice.customer.bcc));

  // Feeds the "Review and submit" compose modal's live Email preview — same
  // shape InvoiceForm.tsx builds for its own create/edit compose step.
  const emailDraft: InvoiceDraft = {
    invoiceNo: invoice.invoiceNo,
    company: {
      name: profile.companyName,
      email: profile.email,
      phone: profile.phone,
      website: profile.website,
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2,
      city: profile.city,
      state: profile.state,
      postalCode: profile.postalCode,
      country: profile.country,
      logoSrc: profile.hasLogo ? profile.logoUrl : null,
      emailFrom: profile.emailFrom,
      bankName: profile.bankName,
      routingNumber: profile.routingNumber,
      accountNumber: profile.accountNumber,
    },
    customerName: displayNameWithParent(invoice.customer),
    customerCompany: invoice.customer.company,
    customerEmail: invoice.customer.primaryEmail,
    customerBillingAddress: invoice.customer.billingAddress,
    customerShippingAddress: invoice.customer.shippingAddress,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    termLabel:
      invoice.term === "custom"
        ? (invoice.customTermLabel ?? TERM_LABEL.custom)
        : TERM_LABEL[invoice.term],
    lineItems: invoice.lineItems.map((li) => ({
      product: li.product,
      month: li.month,
      description: li.description ?? "",
      qty: li.qty,
      rateCents: li.rateCents,
      amountCents: li.amountCents,
    })),
    subtotalCents: invoice.totals.subtotalCents,
    taxCents: invoice.totals.salesTaxCents,
    totalCents: invoice.totals.totalCents,
    salesTaxPct: invoice.salesTaxPct,
    note: invoice.noteToCustomer ?? "",
    paymentInstructions: invoice.paymentInstructions ?? "",
  };

  return (
    <div className="stack-lg">
      <div className="row between wrap-gap no-print">
        <Link href="/portal/invoices" className="back-link">
          <ArrowLeft size={16} /> Back to invoices
        </Link>
        <div className="row" style={{ gap: "0.6rem" }}>
          {invoice.status !== "draft" && <DownloadInvoiceButton invoiceNo={invoice.invoiceNo} />}
          <InvoiceActions
            id={invoice.id}
            status={invoice.status}
            editable={editable}
            emailDraft={emailDraft}
            ccBccCount={ccBccCount}
          />
        </div>
      </div>

      <RevealItem className="card pad no-print">
        <LifecyclePipeline status={invoice.status} />
      </RevealItem>

      <div className="detail-grid">
        {/* Invoice document — same `InvoiceDocument` component the New/Edit
         *  review screen renders, so this submitted invoice's downloadable
         *  PDF (`DownloadInvoiceButton` rasterizes whichever `.card.doc` is
         *  on the page) can never drift from what was shown before submit. */}
        <RevealItem>
          <InvoiceDocument draft={emailDraft} />
        </RevealItem>

        {/* Side rail */}
        <div className="stack no-print">
          <RevealItem>
            <PayorLinkCard publicToken={invoice.publicToken} />
          </RevealItem>
          {invoice.attachments.length > 0 && (
            <RevealItem className="card pad">
              <h3 className="section-title">Attachments</h3>
              <AttachmentList
                invoiceId={invoice.id}
                attachments={invoice.attachments}
                removable={editable}
              />
            </RevealItem>
          )}
          {invoice.memoOnStatement && (
            <RevealItem className="card pad memo">
              <span className="label">Internal memo (hidden from client)</span>
              <p className="muted">{invoice.memoOnStatement}</p>
            </RevealItem>
          )}
          <RevealItem className="card pad">
            <h3 className="section-title">Audit trail</h3>
            <AuditTimeline entries={audit} />
          </RevealItem>
        </div>
      </div>
    </div>
  );
}
