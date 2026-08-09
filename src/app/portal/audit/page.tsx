import { Download } from "lucide-react";
import { getAudit } from "@/lib/portal/queries";
import { formatDate, humanizeAction } from "@/lib/portal/format";
import { ApiError } from "@/components/portal/ApiError";
import { RevealItem } from "@/components/portal/Reveal";

export default async function AuditPage() {
  let entries;
  try {
    entries = await getAudit();
  } catch (e) {
    return <ApiError message={e instanceof Error ? e.message : "Unknown error"} />;
  }

  return (
    <div className="stack-lg">
      <div className="row between wrap-gap">
        <p className="page-subtitle">
          {entries.length} immutable audit record{entries.length === 1 ? "" : "s"} — exportable for
          compliance review.
        </p>
        <a className="btn btn-ghost" href="/api/portal/audit/export.csv">
          <Download size={15} /> Export CSV
        </a>
      </div>

      <RevealItem className="card">
        <div className="table-wrap">
          <table className="itable">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Invoice</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="muted">{formatDate(e.at)}</td>
                  <td className="strong">{humanizeAction(e.action)}</td>
                  <td className="muted">{e.actor}</td>
                  <td className="mono">{e.invoiceId ? e.invoiceId.slice(0, 12) : "—"}</td>
                  <td className="muted-3">{e.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RevealItem>
    </div>
  );
}
