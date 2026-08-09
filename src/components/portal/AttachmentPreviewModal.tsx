"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Download, FileWarning, Loader2, X } from "lucide-react";

// react-pdf/pdfjs-dist touches `DOMMatrix` at import time, which doesn't
// exist in Node — loading it eagerly here would 500 every SSR render of any
// page that (transitively) imports this modal. `ssr: false` keeps the whole
// module out of the server bundle; it only ever loads in the browser.
const PdfPages = dynamic(() => import("./PdfPages"), {
  ssr: false,
  loading: () => (
    <div className="row" style={{ justifyContent: "center", padding: "3rem 0" }}>
      <Loader2 size={22} className="spin muted-3" />
    </div>
  ),
});

/** Shared inline-preview modal for both already-uploaded attachments
 *  (AttachmentList) and not-yet-uploaded staged files (InvoiceForm) — the
 *  caller resolves whatever `url` (a blob URL, from either a server fetch
 *  or a local `File` object) and passes it in; this component only renders. */
export function AttachmentPreviewModal({
  attachment,
  url,
  loading,
  error,
  onDownload,
  onClose,
}: {
  attachment: { filename: string; mimeType: string } | null;
  url: string | null;
  loading: boolean;
  error: string | null;
  onDownload: () => void;
  onClose: () => void;
}) {
  const isImage = attachment?.mimeType.startsWith("image/") ?? false;
  const isPdf = attachment?.mimeType === "application/pdf";

  return (
    <AnimatePresence>
      {attachment && (
        <motion.div
          className="modal-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal modal-wide card"
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row between" style={{ marginBottom: "1rem", alignItems: "center" }}>
              <h3 style={{ margin: 0, wordBreak: "break-word" }}>{attachment.filename}</h3>
              <div className="row" style={{ gap: "0.5rem", flexShrink: 0 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={onDownload}>
                  <Download size={14} /> Download
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={onClose}
                  aria-label="Close preview"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {loading && (
              <div className="row" style={{ justifyContent: "center", padding: "3rem 0" }}>
                <Loader2 size={22} className="spin muted-3" />
              </div>
            )}

            {error && (
              <p className="inline-error" style={{ justifyContent: "center" }}>
                {error}
              </p>
            )}

            {url && isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={attachment.filename}
                style={{ maxWidth: "100%", maxHeight: "75vh", display: "block", margin: "0 auto" }}
              />
            )}

            {url && isPdf && (
              <div style={{ maxHeight: "75vh", overflowY: "auto" }}>
                <PdfPages url={url} />
              </div>
            )}

            {url && !isImage && !isPdf && (
              <div
                className="stack"
                style={{ alignItems: "center", padding: "3rem 0", gap: "0.75rem" }}
              >
                <FileWarning size={28} className="muted-3" />
                <p className="muted-3" style={{ margin: 0, textAlign: "center" }}>
                  This file type can&apos;t be previewed inline. Download it to view it.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
