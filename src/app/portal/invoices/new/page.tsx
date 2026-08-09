import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBillRates, getCustomers } from "@/lib/portal/queries";
import { ApiError } from "@/components/portal/ApiError";
import { InvoiceForm } from "@/components/portal/InvoiceForm";

export default async function NewInvoicePage() {
  let billRates;
  let customers;
  try {
    [billRates, customers] = await Promise.all([getBillRates(), getCustomers()]);
  } catch (e) {
    return <ApiError message={e instanceof Error ? e.message : "Unknown error"} />;
  }

  return (
    <div className="stack-lg">
      <Link href="/portal/invoices" className="back-link no-print">
        <ArrowLeft size={16} /> Back to invoices
      </Link>
      <InvoiceForm billRates={billRates} customers={customers} />
    </div>
  );
}
