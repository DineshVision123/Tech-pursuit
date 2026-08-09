import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getInvoice, getBillRates } from "@/lib/portal/queries";
import { ApiError } from "@/components/portal/ApiError";
import { InvoiceForm } from "@/components/portal/InvoiceForm";

const EDITABLE = new Set(["draft", "rejected"]);

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let invoice;
  let billRates;
  try {
    [invoice, billRates] = await Promise.all([getInvoice(id), getBillRates()]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("not found") || msg.includes("404")) notFound();
    return <ApiError message={msg} />;
  }

  if (!EDITABLE.has(invoice.status)) {
    return (
      <div className="stack-lg">
        <Link href={`/portal/invoices/${id}`} className="back-link">
          <ArrowLeft size={16} /> Back to invoice
        </Link>
        <div className="card pad empty">
          Invoice <strong>{invoice.invoiceNo}</strong> is {invoice.status} and can no longer be
          edited.
        </div>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <Link href={`/portal/invoices/${id}`} className="back-link no-print">
        <ArrowLeft size={16} /> Back to invoice
      </Link>
      <InvoiceForm billRates={billRates} invoice={invoice} />
    </div>
  );
}
