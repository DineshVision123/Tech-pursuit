"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, Trash2 } from "lucide-react";
import { deleteInvoice } from "@/lib/portal/api";
import { money, formatDate } from "@/lib/portal/format";
import { loadStoredMember } from "@/lib/portal/session";
import { StatusBadge } from "./StatusBadge";
import type { Invoice, Member } from "@/lib/portal/types";

/** Same no-notify rationale as Sidebar.tsx's identical pair. */
function noopSubscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): Member | null {
  return null;
}

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const member = useSyncExternalStore(noopSubscribe, loadStoredMember, getServerSnapshot);
  const canDelete = member?.canDeleteInvoices ?? false;

  async function onDelete(inv: Invoice, e: React.MouseEvent) {
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete invoice ${inv.invoiceNo}? This removes it from the list and dashboard totals — it can't be undone from here.`,
      )
    ) {
      return;
    }
    setError(null);
    setBusyId(inv.id);
    const res = await deleteInvoice(inv.id);
    setBusyId(null);
    if (!res.success) {
      setError(res.error ?? "Could not delete the invoice.");
      return;
    }
    router.refresh();
  }

  if (invoices.length === 0) {
    return <div className="empty pad">No invoices match these filters.</div>;
  }

  return (
    <div className="table-wrap">
      {error && (
        <div className="banner banner--danger" role="alert" style={{ margin: "0 0 0.75rem" }}>
          {error}
        </div>
      )}
      <table className="itable">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Due</th>
            <th className="right">Total</th>
            <th>Status</th>
            <th aria-hidden />
            <th aria-hidden />
          </tr>
        </thead>
        <motion.tbody
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          {invoices.map((inv) => (
            <motion.tr
              key={inv.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ backgroundColor: "var(--portal-accent-soft)" }}
              onClick={() => router.push(`/portal/invoices/${inv.id}`)}
              className="itable-row"
            >
              <td className="mono">{inv.invoiceNo}</td>
              <td>
                <div className="cust">
                  <strong>{inv.customer.company ?? inv.customer.name}</strong>
                  <small className="muted-3">{inv.customer.name}</small>
                </div>
              </td>
              <td className="muted">{formatDate(inv.invoiceDate)}</td>
              <td className="muted">{formatDate(inv.dueDate)}</td>
              <td className="right tnum strong">{money(inv.totals.totalCents)}</td>
              <td>
                <StatusBadge status={inv.status} />
              </td>
              <td className="right">
                {canDelete && (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={(e) => void onDelete(inv, e)}
                    disabled={busyId === inv.id}
                    aria-label={`Delete invoice ${inv.invoiceNo}`}
                    title="Delete invoice"
                  >
                    {busyId === inv.id ? (
                      <Loader2 size={15} className="spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                )}
              </td>
              <td className="right">
                <ChevronRight size={16} className="muted-3" />
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}
