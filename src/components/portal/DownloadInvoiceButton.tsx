"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadElementAsPdf } from "@/lib/portal/pdf";

/**
 * "Download" — there's no server-side PDF generation (Phase-1 POC), so this
 * rasterizes the invoice document card and downloads it as a PDF directly —
 * no browser print dialog, no intermediate page.
 */
export function DownloadInvoiceButton({ invoiceNo }: { invoiceNo: string }) {
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    const el = document.querySelector<HTMLElement>(".card.doc");
    if (!el || downloading) return;
    setDownloading(true);
    try {
      await downloadElementAsPdf(el, `${invoiceNo}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button type="button" className="btn btn-ghost" onClick={download} disabled={downloading}>
      {downloading ? (
        <>
          <Loader2 size={15} className="spin" /> Preparing…
        </>
      ) : (
        <>
          <Download size={15} /> Download
        </>
      )}
    </button>
  );
}
