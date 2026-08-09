import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/portal/db";
import { verifyOtpCode, generateSessionToken } from "@/lib/portal/otp";
import { createSession } from "@/lib/portal/auth-server";

export const runtime = "nodejs";

const bodySchema = z.object({
  requestId: z.string().uuid(),
  otp: z.string().trim().min(4).max(6),
});

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, data: null, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: "Enter the code we sent you." },
      { status: 400 },
    );
  }
  const { requestId, otp } = parsed.data;

  const rows = await sql`
    select id, email, code_hash, expires_at, attempts, consumed_at
    from otp_requests where id = ${requestId}
  `;
  const row = rows[0] as
    | {
        id: string;
        email: string;
        code_hash: string;
        expires_at: string;
        attempts: number;
        consumed_at: string | null;
      }
    | undefined;

  const invalid = () =>
    NextResponse.json(
      { success: false, data: null, error: "Incorrect or expired code." },
      { status: 401 },
    );

  if (!row || row.consumed_at) return invalid();
  if (new Date(row.expires_at).getTime() < Date.now()) return invalid();
  if (row.attempts >= MAX_ATTEMPTS) return invalid();

  if (!verifyOtpCode(otp, row.code_hash)) {
    await sql`update otp_requests set attempts = attempts + 1 where id = ${requestId}`;
    return invalid();
  }

  const members = await sql`
    select id, email, name, can_delete_invoices from invoice_members where email = ${row.email}
  `;
  const member = members[0] as
    | { id: string; email: string; name: string | null; can_delete_invoices: boolean }
    | undefined;
  if (!member) return invalid(); // shouldn't happen — the request route only emails allowlisted members

  await sql`update otp_requests set consumed_at = now() where id = ${requestId}`;

  const token = generateSessionToken();
  await createSession(member.id, token);

  return NextResponse.json({
    success: true,
    data: {
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        canDeleteInvoices: member.can_delete_invoices,
      },
    },
    error: null,
  });
}
