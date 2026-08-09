import { notFound } from "next/navigation";
import { TERM_LABEL } from "@/lib/portal/format";
import { PayorPreview } from "@/components/portal/InvoicePreview";
import type { InvoiceDraft } from "@/components/portal/InvoicePreview";
import { getPublicInvoiceView } from "@/lib/portal/queries";

/**
 * The real "Payor view" — a genuine shareable link a customer can open
 * without logging in. Lives outside `/portal` entirely (no sidebar, no auth
 * gate — `middleware.ts`'s matcher only covers `/portal/:path*`). The token
 * in the URL is the only access check — see `getPublicInvoiceView`.
 */

export const metadata = {
  title: "Invoice",
};

export default async function PayInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invoice = await getPublicInvoiceView(token);
  if (!invoice) notFound();

  const draft: InvoiceDraft = {
    invoiceNo: invoice.invoiceNo,
    company: {
      name: invoice.from.name,
      email: invoice.from.email,
      phone: invoice.from.phone,
      website: invoice.from.website,
      addressLine1: invoice.from.addressLine1,
      addressLine2: invoice.from.addressLine2,
      city: invoice.from.city,
      state: invoice.from.state,
      postalCode: invoice.from.postalCode,
      country: invoice.from.country,
      logoSrc: invoice.from.logoUrl,
      // Not part of the narrowed public response — this page never renders
      // a "From" field, only the staff-facing compose steps do.
      emailFrom: null,
      bankName: invoice.from.bankName,
      routingNumber: invoice.from.routingNumber,
      accountNumber: invoice.from.accountNumber,
    },
    customerName: invoice.customer.name,
    customerCompany: invoice.customer.company,
    customerEmail: "",
    // The public payor view deliberately doesn't expose billing/shipping
    // addresses — only the staff-facing preview reads these.
    customerBillingAddress: null,
    customerShippingAddress: null,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    termLabel:
      invoice.term === "custom" ? (invoice.customTermLabel ?? "Custom") : TERM_LABEL[invoice.term],
    lineItems: invoice.lineItems.map((li) => ({ ...li, description: li.description ?? "" })),
    subtotalCents: invoice.totals.subtotalCents,
    taxCents: invoice.totals.salesTaxCents,
    totalCents: invoice.totals.totalCents,
    salesTaxPct: invoice.salesTaxPct,
    note: invoice.noteToCustomer ?? "",
    paymentInstructions: invoice.paymentInstructions ?? "",
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "3rem 1rem" }}>
      <PayorPreview draft={draft} isPreview={false} />
    </div>
  );
}
