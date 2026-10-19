import { getInvoices } from "@/lib/portal/queries";
import { nextInvoiceNumber } from "@/lib/portal/invoice-number";
import { invoiceSequence, money } from "@/lib/portal/format";
import { ApiError } from "@/components/portal/ApiError";
import { InvoiceTable } from "@/components/portal/InvoiceTable";
import { InvoiceFilters } from "@/components/portal/InvoiceFilters";
import type { InvoiceStatus } from "@/lib/portal/types";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;

  // The top invoice is found from the global next number, not this (possibly
  // status-filtered) list. A failed lookup just means no row gets the
  // "free up the number" option — it never blocks the list itself.
  let invoices;
  let nextNo: string | null;
  try {
    [invoices, nextNo] = await Promise.all([
      getInvoices({ status: status as InvoiceStatus | undefined, search: q }),
      nextInvoiceNumber().catch(() => null),
    ]);
  } catch (e) {
    return <ApiError message={e instanceof Error ? e.message : "Unknown error"} />;
  }
  const highestSequence = nextNo ? invoiceSequence(nextNo) - 1 : null;

  const totalValue = invoices.reduce((sum, inv) => sum + inv.totals.totalCents, 0);

  return (
    <div className="stack-lg">
      <div className="row between wrap-gap">
        <InvoiceFilters />
        <span className="muted-3">
          {invoices.length} invoice{invoices.length === 1 ? "" : "s"} ·{" "}
          <strong className="tnum">{money(totalValue)}</strong>
        </span>
      </div>
      <div className="card">
        <InvoiceTable invoices={invoices} highestSequence={highestSequence} />
      </div>
    </div>
  );
}
