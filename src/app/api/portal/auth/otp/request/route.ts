import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/portal/db";
import { generateOtpCode, hashOtpCode } from "@/lib/portal/otp";
import { sendInvoiceOtpEmail } from "@/lib/portal/email";

export const runtime = "nodejs";

const bodySchema = z.object({ email: z.string().trim().email() });

const OTP_TTL_MINUTES = 10;
const MAX_ACTIVE_REQUESTS_PER_WINDOW = 5;

/**
 * POST /api/portal/auth/otp/request — allowlist-gated: silently succeeds
 * (same response either way) whether or not the email is a real member, so
 * this endpoint can't be used to probe who has portal access. Only an
 * allowlisted email actually receives a code.
 */
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
      { success: false, data: null, error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  const email = parsed.data.email.toLowerCase();

  const members = await sql`select id from invoice_members where email = ${email}`;
  const requestId = crypto.randomUUID();

  if (members.length === 0) {
    // Don't reveal whether the email is allowlisted — just don't send a
    // real code, but still hand back a requestId so the client-side flow
    // (and an attacker probing for valid emails) can't tell the difference.
    return NextResponse.json({ success: true, data: { requestId }, error: null });
  }

  // Basic rate limiting: cap how many still-usable codes one email can have
  // requested recently, rather than letting a script hammer the endpoint.
  const recent = await sql`
    select count(*)::int as count from otp_requests
    where email = ${email} and created_at > now() - interval '15 minutes' and consumed_at is null
  `;
  if ((recent[0] as { count: number }).count >= MAX_ACTIVE_REQUESTS_PER_WINDOW) {
    return NextResponse.json(
      { success: false, data: null, error: "Too many codes requested — try again in a few minutes." },
      { status: 429 },
    );
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await sql`
    insert into otp_requests (id, email, code_hash, expires_at)
    values (${requestId}, ${email}, ${codeHash}, ${expiresAt.toISOString()})
  `;

  const sent = await sendInvoiceOtpEmail(email, code);
  if (!sent.ok) {
    return NextResponse.json({ success: false, data: null, error: sent.error }, { status: 502 });
  }

  return NextResponse.json({ success: true, data: { requestId }, error: null });
}
