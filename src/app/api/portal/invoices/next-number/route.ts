import { NextResponse } from "next/server";
import { requireMember } from "@/lib/portal/auth-server";
import { nextInvoiceNumber } from "@/lib/portal/invoice-number";

export const runtime = "nodejs";

/** Preview only, not a reservation — the real number is assigned again (and
 *  could differ if another invoice was created in between) when the invoice
 *  is actually saved via `POST /api/portal/invoices`. */
export async function GET() {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;

  const invoiceNo = await nextInvoiceNumber();
  return NextResponse.json({ success: true, data: { invoiceNo }, error: null });
}
