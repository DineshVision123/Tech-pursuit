import { NextResponse } from "next/server";
import { sql } from "@/lib/portal/db";
import { requireMember } from "@/lib/portal/auth-server";
import { getCompanyProfile } from "@/lib/portal/queries";

export const runtime = "nodejs";

const MAX_LOGO_BYTES = 4 * 1024 * 1024; // 4MB

export async function POST(request: Request) {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, data: null, error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ success: false, data: null, error: "Logo must be under 4MB." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  await sql`
    update company_profile set logo_bytes = ${bytes}, logo_mime = ${file.type || "image/png"}, updated_at = now()
    where id = true
  `;

  const profile = await getCompanyProfile();
  return NextResponse.json({ success: true, data: profile, error: null });
}

export async function DELETE() {
  const member = await requireMember();
  if (member instanceof NextResponse) return member;

  await sql`update company_profile set logo_bytes = null, logo_mime = null, updated_at = now() where id = true`;
  const profile = await getCompanyProfile();
  return NextResponse.json({ success: true, data: profile, error: null });
}
