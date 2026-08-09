import { Loader2 } from "lucide-react";

export default function InvoicesLoading() {
  return (
    <div className="row" style={{ justifyContent: "center", padding: "4rem 0" }}>
      <Loader2 size={22} className="spin muted-3" />
    </div>
  );
}
