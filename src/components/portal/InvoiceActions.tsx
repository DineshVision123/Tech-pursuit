"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Send, BadgeDollarSign, Pencil, Loader2, Mail, ArrowLeft } from "lucide-react";
import { transitionInvoice, updateInvoice } from "@/lib/portal/api";
import { STATUS_LABEL } from "@/lib/portal/format";
import { InvoicePreview, type InvoiceDraft } from "./InvoicePreview";
import type { InvoiceStatus } from "@/lib/portal/types";

/** Which next-statuses each status may transition to (mirrors the API table). */
const NEXT: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: [],
  approved: ["submitted", "rejected"],
  rejected: ["draft"],
  submitted: ["paid"],
  paid: [],
};

const ACTION_META: Record<InvoiceStatus, { label: string; icon: typeof Check; variant: string }> = {
  approved: { label: "Approve", icon: Check, variant: "btn-primary" },
  rejected: { label: "Reject", icon: X, variant: "btn-danger" },
  submitted: { label: "Review and submit", icon: Send, variant: "btn-primary" },
  paid: { label: "Mark paid", icon: BadgeDollarSign, variant: "btn-primary" },
  draft: { label: "Resubmit", icon: Check, variant: "btn-primary" },
};

export function InvoiceActions({
  id,
  status,
  editable,
  emailDraft,
  ccBccCount,
}: {
  id: string;
  status: InvoiceStatus;
  editable: boolean;
  emailDraft: InvoiceDraft;
  ccBccCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<InvoiceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  // "Review and submit" opens this compose step instead of sending straight
  // away — same Subject/Message + live preview pattern as the create/edit
  // form's own compose step (InvoiceForm.tsx), so both entry points into
  // "submit this invoice" behave the same way.
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const run = async (to: InvoiceStatus, reasonText?: string) => {
    setBusy(to);
    setError(null);
    const res = await transitionInvoice(id, to, reasonText);
    setBusy(null);
    if (!res.success) {
      setError(res.error ?? "Could not update the invoice.");
      return;
    }
    setRejecting(false);
    setReason("");
    router.refresh();
  };

  const openCompose = () => {
    setError(null);
    setSubject(`Your invoice is ready — ${emailDraft.invoiceNo} from ${emailDraft.company.name}`);
    setMessage(emailDraft.note);
    setComposing(true);
  };

  const confirmSend = async () => {
    setBusy("submitted");
    setError(null);
    // The message doubles as the invoice's "Note to customer" — only write
    // it back if it actually changed, so a plain send doesn't touch
    // anything it didn't need to.
    if (message.trim() !== emailDraft.note.trim()) {
      const patch = await updateInvoice(id, { noteToCustomer: message.trim() || null });
      if (!patch.success) {
        setBusy(null);
        setError(patch.error ?? "Could not save the message.");
        return;
      }
    }
    const res = await transitionInvoice(id, "submitted", undefined, subject.trim());
    setBusy(null);
    if (!res.success) {
      setError(res.error ?? "Could not update the invoice.");
      return;
    }
    setComposing(false);
    router.refresh();
  };

  const next = NEXT[status];

  return (
    <div className="actions">
      {editable && (
        <Link href={`/portal/invoices/${id}/edit`} className="btn btn-ghost">
          <Pencil size={15} /> Edit
        </Link>
      )}

      {next.map((to) => {
        const meta = ACTION_META[to];
        const Icon = meta.icon;
        const isReject = to === "rejected";
        const isSubmit = to === "submitted";
        return (
          <button
            key={to}
            className={`btn ${meta.variant}`}
            disabled={busy !== null}
            onClick={() => (isReject ? setRejecting(true) : isSubmit ? openCompose() : run(to))}
          >
            {busy === to ? <Loader2 size={15} className="spin" /> : <Icon size={15} />}
            {meta.label}
          </button>
        );
      })}

      {next.length === 0 && !editable && (
        <span className="muted-3">No further actions — invoice is {STATUS_LABEL[status]}.</span>
      )}

      {error && <span className="inline-error">{error}</span>}

      {/* Reject reason modal — reason is mandatory (Report §4) */}
      <AnimatePresence>
        {rejecting && (
          <motion.div
            className="modal-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRejecting(false)}
          >
            <motion.div
              className="modal card"
              initial={{ scale: 0.94, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Reject invoice</h3>
              <p className="muted">
                A reason is logged to the audit trail and shown to the creator.
              </p>
              <textarea
                className="textarea"
                rows={3}
                autoFocus
                placeholder="e.g. Bill rate doesn't match the signed SOW."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div
                className="row"
                style={{ gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.9rem" }}
              >
                <button className="btn btn-ghost" onClick={() => setRejecting(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  disabled={!reason.trim() || busy !== null}
                  onClick={() => run("rejected", reason.trim())}
                >
                  {busy === "rejected" ? <Loader2 size={15} className="spin" /> : <X size={15} />}
                  Reject invoice
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit compose step — Subject/Message + live preview, same pattern
       *  as InvoiceForm.tsx's own compose step. */}
      <AnimatePresence>
        {composing && (
          <motion.div
            className="modal-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setComposing(false)}
          >
            <motion.div
              className="modal modal-wide card"
              initial={{ scale: 0.96, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Email your invoice</h3>
              <p className="muted">This is what actually gets sent when you submit.</p>
              <div className="review-split">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="field" style={{ display: "block", marginBottom: "0.85rem" }}>
                    <span className="label">From</span>
                    <input
                      className="input input-readonly"
                      value={
                        emailDraft.company.emailFrom ??
                        (emailDraft.company.email
                          ? `${emailDraft.company.name} <${emailDraft.company.email}>`
                          : emailDraft.company.name)
                      }
                      readOnly
                      tabIndex={-1}
                    />
                  </label>
                  <label className="field" style={{ display: "block", marginBottom: "0.85rem" }}>
                    <span className="label">To</span>
                    <input
                      className="input input-readonly"
                      value={emailDraft.customerEmail}
                      readOnly
                      tabIndex={-1}
                    />
                  </label>
                  {ccBccCount > 0 && (
                    <p className="muted-3" style={{ fontSize: "0.78rem", marginTop: "-0.5rem" }}>
                      {ccBccCount} Cc/Bcc also on this invoice will receive it too.
                    </p>
                  )}
                  <label
                    className="field"
                    style={{ display: "block", marginTop: "0.85rem", marginBottom: "0.85rem" }}
                  >
                    <span className="label">Subject</span>
                    <input
                      className="input"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </label>
                  <label className="field" style={{ display: "block" }}>
                    <span className="label">Message</span>
                    <textarea
                      className="textarea"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="A personal note included in the email, under the invoice details."
                    />
                  </label>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <InvoicePreview view="email" draft={{ ...emailDraft, note: message }} />
                </div>
              </div>

              {error && (
                <p className="inline-error" style={{ marginTop: "0.9rem" }}>
                  {error}
                </p>
              )}

              <div
                className="row"
                style={{ gap: "0.6rem", justifyContent: "flex-end", marginTop: "1.1rem" }}
              >
                <button className="btn btn-ghost" onClick={() => setComposing(false)}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button className="btn btn-primary" disabled={busy !== null} onClick={confirmSend}>
                  {busy === "submitted" ? (
                    <>
                      <Loader2 size={15} className="spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Mail size={15} /> Send invoice
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
