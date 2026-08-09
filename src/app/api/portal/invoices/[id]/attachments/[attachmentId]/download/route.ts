import { NextResponse } from "next/server";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;
  const { id, attachmentId } = await params;

  const rows = await sql`
    select filename, mime_type, bytes from invoice_attachments
    where id = ${attachmentId} and invoice_id = ${id}
  `;
  if (rows.length === 0) {
    return NextResponse.json({ success: false, data: null, error: "Attachment not found." }, { status: 404 });
  }
  const r = rows[0] as { filename: string; mime_type: string; bytes: Buffer };

  return new NextResponse(new Uint8Array(r.bytes), {
    headers: {
      "Content-Type": r.mime_type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(r.filename)}"`,
    },
  });
}
