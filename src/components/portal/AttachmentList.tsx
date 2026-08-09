"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, Loader2, Paperclip, X } from "lucide-react";
import { deleteAttachment, downloadAttachment, previewAttachmentUrl } from "@/lib/portal/api";
import { formatBytes } from "@/lib/portal/format";
import { AttachmentPreviewModal } from "./AttachmentPreviewModal";
import type { Attachment } from "@/lib/portal/types";

/** Already-uploaded attachments — click the name (or the eye icon) to view
 *  it inline without downloading; download always available; delete only
 *  when `removable` (the invoice is still draft/rejected). */
export function AttachmentList({
  invoiceId,
  attachments,
  onRemoved,
  removable = false,
}: {
  invoiceId: string;
  attachments: readonly Attachment[];
  onRemoved?: (id: string) => void;
  removable?: boolean;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Attachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const router = useRouter();

  // The object URL is only valid for as long as the preview is open — revoke
  // it the moment we're done with it (closing, switching files, unmounting).
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleRemove(a: Attachment) {
    setBusyId(a.id);
    const res = await deleteAttachment(invoiceId, a.id);
    setBusyId(null);
    if (!res.success) return;
    if (onRemoved) onRemoved(a.id);
    else router.refresh();
  }

  async function openPreview(a: Attachment) {
    setPreviewing(a);
    setPreviewUrl(null);
    setPreviewError(null);
    setPreviewLoading(true);
    const res = await previewAttachmentUrl(invoiceId, a.id);
    setPreviewLoading(false);
    if (!res.success) {
      setPreviewError(res.error);
      return;
    }
    setPreviewUrl(res.url);
  }

  function closePreview() {
    setPreviewing(null);
    setPreviewUrl(null);
    setPreviewError(null);
  }

  if (attachments.length === 0) {
    return <p className="muted-3">No attachments.</p>;
  }

  return (
    <>
      <ul className="attachment-list">
        {attachments.map((a) => (
          <li key={a.id} className="attachment-row">
            <Paperclip size={14} className="muted-3" />
            <button
              type="button"
              className="attachment-name"
              onClick={() => void openPreview(a)}
              title="View"
            >
              {a.filename}
            </button>
            <span className="muted-3 attachment-size">{formatBytes(a.sizeBytes)}</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => void openPreview(a)}
              aria-label={`View ${a.filename}`}
              title="View"
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => void downloadAttachment(invoiceId, a)}
              aria-label={`Download ${a.filename}`}
              title="Download"
            >
              <Download size={14} />
            </button>
            {removable && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => handleRemove(a)}
                disabled={busyId === a.id}
                aria-label={`Remove ${a.filename}`}
              >
                {busyId === a.id ? <Loader2 size={14} className="spin" /> : <X size={14} />}
              </button>
            )}
          </li>
        ))}
      </ul>

      <AttachmentPreviewModal
        attachment={previewing}
        url={previewUrl}
        loading={previewLoading}
        error={previewError}
        onDownload={() => previewing && void downloadAttachment(invoiceId, previewing)}
        onClose={closePreview}
      />
    </>
  );
}
