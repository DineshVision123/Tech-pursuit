import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sql } from "./db";
import { SESSION_COOKIE_NAME } from "./session";
import type { Member } from "./types";

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

/** Reads the httpOnly session cookie and resolves the logged-in member, or
 *  `null` if there isn't a valid one. This — not `middleware.ts` — is the
 *  real authorization check; call it at the top of every protected
 *  `/api/portal/**` route handler and server-only query. */
export async function getCurrentMember(): Promise<Member | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await sql`
    select m.id, m.email, m.name, m.can_delete_invoices
    from sessions s
    join invoice_members m on m.id = s.member_id
    where s.token = ${token} and s.expires_at > now()
  `;
  const row = rows[0] as
    | { id: string; email: string; name: string | null; can_delete_invoices: boolean }
    | undefined;
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    canDeleteInvoices: row.can_delete_invoices,
  };
}

/** Creates a session row and sets the httpOnly cookie on `response`. */
export async function createSession(memberId: string, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await sql`
    insert into sessions (token, member_id, expires_at)
    values (${token}, ${memberId}, ${expiresAt.toISOString()})
  `;
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Deletes the session row (if any) and clears the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await sql`delete from sessions where token = ${token}`;
  }
  store.set(SESSION_COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

/** Shared guard for every protected `/api/portal/**` route handler:
 *  `const member = await requireMember(); if (member instanceof NextResponse) return member;`
 *  — returns the 401 response directly so callers can `return` it as-is. */
export async function requireMember(): Promise<Member | NextResponse> {
  const member = await getCurrentMember();
  if (!member) {
    return NextResponse.json({ success: false, data: null, error: "Not signed in." }, { status: 401 });
  }
  return member;
}
