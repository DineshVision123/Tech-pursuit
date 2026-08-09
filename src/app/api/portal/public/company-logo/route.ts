import { NextResponse } from "next/server";
import { sql } from "@/lib/portal/db";

export const runtime = "nodejs";

/** Deliberately unauthenticated — the logo needs to render on the public
 *  `/pay/[token]` page too, which has no session. Not sensitive data. */
export async function GET() {
  const rows = await sql`select logo_bytes, logo_mime from company_profile where id = true`;
  const row = rows[0] as { logo_bytes: Buffer | null; logo_mime: string | null } | undefined;
  if (!row?.logo_bytes) {
    return NextResponse.json({ success: false, data: null, error: "No logo set." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(row.logo_bytes), {
    headers: {
      "Content-Type": row.logo_mime ?? "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
