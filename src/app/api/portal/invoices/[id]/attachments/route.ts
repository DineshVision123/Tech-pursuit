import { NextResponse } from "next/server";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB per file

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;
  const { id } = await params;

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ success: false, data: null, error: "Invalid upload." }, { status: 400 });
  }
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ success: false, data: null, error: "No file provided." }, { status: 400 });
  }
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { success: false, data: null, error: `${file.name} is larger than the 10MB limit.` },
        { status: 413 },
      );
    }
  }

  const created = [];
  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const rows = await sql`
      insert into invoice_attachments (invoice_id, filename, mime_type, size_bytes, bytes, uploaded_by)
      values (${id}, ${file.name}, ${file.type || "application/octet-stream"}, ${file.size}, ${bytes}, ${member.email})
      returning id, filename, mime_type, size_bytes, uploaded_at, uploaded_by
    `;
    const r = rows[0] as Record<string, unknown>;
    created.push({
      id: r.id as string,
      filename: r.filename as string,
      mimeType: r.mime_type as string,
      sizeBytes: r.size_bytes as number,
      uploadedAt: (r.uploaded_at as Date).toISOString(),
      uploadedBy: r.uploaded_by as string,
    });
  }

  await sql`
    insert into audit_log (invoice_id, action, actor, after)
    values (${id}, 'attachment.uploaded', ${member.email}, ${JSON.stringify({ files: created.map((c) => c.filename) })})
  `;

  return NextResponse.json({ success: true, data: created, error: null }, { status: 201 });
}
