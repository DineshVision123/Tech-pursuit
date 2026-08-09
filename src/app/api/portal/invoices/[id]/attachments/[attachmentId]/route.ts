import { NextResponse } from "next/server";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;
  const { id, attachmentId } = await params;

  await sql`delete from invoice_attachments where id = ${attachmentId} and invoice_id = ${id}`;
  await sql`
    insert into audit_log (invoice_id, action, actor)
    values (${id}, 'attachment.deleted', ${member.email})
  `;

  return NextResponse.json({ success: true, data: { deleted: true }, error: null });
}
