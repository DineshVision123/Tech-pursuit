"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";

// One-time global setup — the worker that does the actual PDF parsing off
// the main thread. Bundled as a static asset so there's no CDN dependency.
// This whole module must never load during SSR (Node has no DOMMatrix,
// which pdfjs-dist's canvas backend needs at import time) — see the
// next/dynamic(..., { ssr: false }) import in AttachmentPreviewModal.tsx.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/** Renders every page of the PDF stacked and scrollable — deliberately no
 *  toolbar/sidebar/zoom controls of its own (unlike embedding via <iframe>,
 *  which drags in the browser's whole native PDF-viewer chrome): just the
 *  document, full width, nothing else. */
export default function PdfPages({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);

  return (
    <Document
      file={url}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      loading={
        <div className="row" style={{ justifyContent: "center", padding: "3rem 0" }}>
          <Loader2 size={22} className="spin muted-3" />
        </div>
      }
      error={
        <p className="inline-error" style={{ justifyContent: "center" }}>
          Could not render this PDF.
        </p>
      }
    >
      <div className="stack" style={{ gap: "1rem", alignItems: "center" }}>
        {Array.from({ length: numPages ?? 0 }, (_, i) => (
          <Page
            key={i}
            pageNumber={i + 1}
            width={760}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ))}
      </div>
    </Document>
  );
}
