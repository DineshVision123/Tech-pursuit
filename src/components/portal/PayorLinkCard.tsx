"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

/** The real, shareable "Payor view" link — copy and send it to the
 *  customer directly (e.g. via the Email view's content). */
export function PayorLinkCard({ publicToken }: { readonly publicToken: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/pay/${publicToken}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card pad">
      <h3 className="section-title">Payor link</h3>
      <p className="muted-3" style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>
        Send this to the customer — no login needed to view or &quot;pay&quot; the invoice.
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="btn btn-ghost full"
        style={{ justifyContent: "center", gap: "0.5rem" }}
      >
        <Link2 size={15} />
        {copied ? "Copied!" : "Copy payor link"}
      </button>
    </div>
  );
}
