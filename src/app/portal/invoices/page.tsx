import { getInvoices } from "@/lib/portal/queries";
import { money } from "@/lib/portal/format";
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

  let invoices;
  try {
    invoices = await getInvoices({ status: status as InvoiceStatus | undefined, search: q });
  } catch (e) {
    return <ApiError message={e instanceof Error ? e.message : "Unknown error"} />;
  }

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
        <InvoiceTable invoices={invoices} />
      </div>
    </div>
  );
}
