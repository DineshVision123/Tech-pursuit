import { getDashboard, getInvoices } from "@/lib/portal/queries";
import { money } from "@/lib/portal/format";
import { ApiError } from "@/components/portal/ApiError";
import { RevealItem } from "@/components/portal/Reveal";
import { DashboardTiles } from "@/components/portal/DashboardTiles";
import { StatusDistribution } from "@/components/portal/StatusDistribution";
import { RecentActivity } from "@/components/portal/RecentActivity";
import { InvoiceTable } from "@/components/portal/InvoiceTable";

export default async function DashboardPage() {
  let data;
  let recent;
  try {
    [data, recent] = await Promise.all([getDashboard(), getInvoices()]);
  } catch (e) {
    return <ApiError message={e instanceof Error ? e.message : "Unknown error"} />;
  }

  return (
    <div className="stack-lg">
      <DashboardTiles data={data} />

      <div className="grid-2">
        <RevealItem className="card pad">
          <div className="row between" style={{ marginBottom: "1rem" }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Status distribution
            </h2>
            <span className="muted-3">{money(data.outstandingCents)} in flight</span>
          </div>
          <StatusDistribution counts={data.statusCounts} />
        </RevealItem>

        <RevealItem className="card pad">
          <h2 className="section-title">Recent activity</h2>
          <RecentActivity items={data.recentActivity} />
        </RevealItem>
      </div>

      <RevealItem className="card">
        <div className="row between pad-x pad-top">
          <h2 className="section-title" style={{ margin: 0 }}>
            Latest invoices
          </h2>
        </div>
        <InvoiceTable invoices={recent.slice(0, 6)} />
      </RevealItem>
    </div>
  );
}
