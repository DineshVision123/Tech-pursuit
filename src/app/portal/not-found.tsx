import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="card pad empty"
      style={{ display: "grid", gap: "0.6rem", placeItems: "center" }}
    >
      <FileQuestion size={30} className="muted-3" />
      <h2>Invoice not found</h2>
      <p className="muted">This invoice doesn&apos;t exist or has been removed.</p>
      <Link href="/portal/invoices" className="btn btn-ghost">
        Back to invoices
      </Link>
    </div>
  );
}
