"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { deleteInvoice } from "@/lib/portal/api";
import { money, formatDate, invoiceSequence } from "@/lib/portal/format";
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

type BusyMode = "keep" | "reclaim";

// `.btn` is `white-space: nowrap`, which makes the long hint overflow the card
// and squeezes the icon to zero width — let these two wrap instead.
const choiceStyle: React.CSSProperties = {
  width: "100%",
  justifyContent: "flex-start",
  textAlign: "left",
  alignItems: "flex-start",
  whiteSpace: "normal",
  gap: "0.65rem",
};

const choiceIconStyle: React.CSSProperties = { flexShrink: 0, marginTop: "0.15rem" };

const choiceTextStyle: React.CSSProperties = { gap: "0.15rem", minWidth: 0 };

/**
 * `highestSequence` is the sequence of the top (highest-numbered) invoice
 * across *all* invoices, from the global next number — only that one gets the
 * "free up the number" option, since next = max + 1 and gaps are never filled:
 * deleting any older invoice can't change what the next number will be.
 */
export function InvoiceTable({
  invoices,
  highestSequence,
}: {
  invoices: Invoice[];
  highestSequence: number | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Invoice | null>(null);
  const [busyMode, setBusyMode] = useState<BusyMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const member = useSyncExternalStore(noopSubscribe, loadStoredMember, getServerSnapshot);

  const isHighest = (inv: Invoice) =>
    highestSequence !== null && invoiceSequence(inv.invoiceNo) === highestSequence;

  function onDelete(inv: Invoice, e: React.MouseEvent) {
    e.stopPropagation();
    setError(null);
    setPending(inv);
  }

  async function confirmDelete(reclaimNumber: boolean) {
    if (!pending) return;
    setBusyMode(reclaimNumber ? "reclaim" : "keep");
    const res = await deleteInvoice(pending.id, reclaimNumber);
    setBusyMode(null);
    if (!res.success) {
      setError(res.error ?? "Could not delete the invoice.");
      return;
    }
    setPending(null);
    router.refresh();
  }

  if (invoices.length === 0) {
    return <div className="empty pad">No invoices match these filters.</div>;
  }

  const busy = busyMode !== null;

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
                {member && (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={(e) => onDelete(inv, e)}
                    disabled={busy && pending?.id === inv.id}
                    aria-label={`Delete invoice ${inv.invoiceNo}`}
                    title="Delete invoice"
                  >
                    <Trash2 size={15} />
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

      <AnimatePresence>
        {pending && (
          <motion.div
            className="modal-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!busy) setPending(null);
            }}
          >
            <motion.div
              className="modal card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-invoice-title"
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="delete-invoice-title">Delete invoice {pending.invoiceNo}?</h3>

              {isHighest(pending) ? (
                <>
                  <p className="muted">This can&apos;t be undone. Pick one:</p>
                  {error && <p className="inline-error">{error}</p>}
                  <div className="stack" style={{ gap: "0.6rem" }}>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={choiceStyle}
                      disabled={busy}
                      onClick={() => void confirmDelete(false)}
                    >
                      {busyMode === "keep" ? (
                        <Loader2 size={15} className="spin" style={choiceIconStyle} />
                      ) : (
                        <Trash2 size={15} style={choiceIconStyle} />
                      )}
                      <span className="stack" style={choiceTextStyle}>
                        <span>Just delete it</span>
                        <small style={{ fontWeight: 400, opacity: 0.85 }}>
                          The number {pending.invoiceNo} will never be used again. Pick this if you
                          already sent this invoice to the customer.
                        </small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={choiceStyle}
                      disabled={busy}
                      onClick={() => void confirmDelete(true)}
                    >
                      {busyMode === "reclaim" ? (
                        <Loader2 size={15} className="spin" style={choiceIconStyle} />
                      ) : (
                        <RotateCcw size={15} style={choiceIconStyle} />
                      )}
                      <span className="stack" style={choiceTextStyle}>
                        <span>Delete and free up the number</span>
                        <small style={{ fontWeight: 400, opacity: 0.85 }}>
                          Your next new invoice will be numbered {pending.invoiceNo} again.
                        </small>
                      </span>
                    </button>
                  </div>
                  <div className="row" style={{ justifyContent: "flex-end", marginTop: "1rem" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() => setPending(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="muted">This can&apos;t be undone.</p>
                  {error && <p className="inline-error">{error}</p>}
                  <div className="row" style={{ justifyContent: "flex-end", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() => setPending(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={busy}
                      onClick={() => void confirmDelete(false)}
                    >
                      {busy ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                      Delete invoice
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
