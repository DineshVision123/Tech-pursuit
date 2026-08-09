import { NextResponse } from "next/server";
import { requireMember } from "@/lib/portal/auth-server";
import { getAudit } from "@/lib/portal/queries";

export const runtime = "nodejs";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET() {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;

  const entries = await getAudit();
  const header = ["When", "Action", "Actor", "Invoice ID", "Reason"];
  const lines = [
    header.join(","),
    ...entries.map((e) =>
      [e.at, e.action, e.actor, e.invoiceId ?? "", e.reason ?? ""].map(csvEscape).join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log.csv"`,
    },
  });
}
