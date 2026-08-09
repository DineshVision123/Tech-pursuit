/**
 * Client-side member display cache — email/OTP login.
 *
 * The actual session credential is an httpOnly `invoice_session` cookie,
 * set and cleared entirely server-side (see `src/app/api/portal/auth/*`
 * route handlers and `src/middleware.ts`) — client JS never reads or writes
 * it. That's only possible because the portal and its API now live in the
 * same Next.js app/origin; the copied-from-elsewhere version of this file
 * used a plain (non-HttpOnly, JS-readable) cookie purely as a workaround for
 * frontend and backend being on different ports/origins, which no longer
 * applies here.
 *
 * What *does* still live here: the member's display info (name/email, never
 * a credential), cached in localStorage purely so the Sidebar can render
 * instantly on hydration instead of waiting on a round trip.
 */

import type { AuthSession, Member } from "./types";

/** Shared with the server-side auth routes and `middleware.ts` — just a
 *  name, not a secret, safe to reference from client code too. */
export const SESSION_COOKIE_NAME = "invoice_session";

const MEMBER_STORAGE_KEY = "invoice.member.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function storeSession(session: AuthSession): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(session.member));
  } catch {
    // localStorage may be unavailable (private mode) — harmless, the
    // Sidebar just falls back to its "Member" placeholder until the next
    // server round trip fills it in.
  }
}

export function clearSession(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(MEMBER_STORAGE_KEY);
  } catch {
    // see storeSession
  }
}

// `loadStoredMember` is used as a `useSyncExternalStore` snapshot (Sidebar.tsx),
// which requires the SAME object reference back when nothing changed — parsing
// fresh JSON on every call would return a new object each time and React
// treats that as an infinite store-change loop ("getSnapshot should be
// cached"). Cache by the raw string so repeated calls are referentially
// stable until localStorage actually changes.
let cachedRaw: string | null | undefined;
let cachedMember: Member | null = null;

export function loadStoredMember(): Member | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(MEMBER_STORAGE_KEY);
  if (raw === cachedRaw) return cachedMember;
  cachedRaw = raw;
  cachedMember = parseMember(raw);
  return cachedMember;
}

function parseMember(raw: string | null): Member | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const v = parsed as Record<string, unknown>;
    if (typeof v["id"] !== "string" || typeof v["email"] !== "string") return null;
    return {
      id: v["id"],
      email: v["email"],
      name: typeof v["name"] === "string" ? v["name"] : null,
      canDeleteInvoices: v["canDeleteInvoices"] === true,
    };
  } catch {
    return null;
  }
}
