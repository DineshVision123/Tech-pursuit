/**
 * Email/OTP login — calls this same app's own `/api/portal/auth/*` route
 * handlers (same-origin, so the session cookie the server sets on verify is
 * sent/received automatically; no manual Bearer-token plumbing needed).
 */

import { clearSession, storeSession } from "./session";
import type { AuthSession } from "./types";

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

async function post<T>(path: string, body: unknown): Promise<Envelope<T>> {
  try {
    const res = await fetch(`/api/portal${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as Envelope<T>;
  } catch {
    return { success: false, data: null, error: "Could not reach the login server." };
  }
}

/** `POST /api/portal/auth/otp/request` — sends a 6-digit code to `email`. */
export function requestEmailOtp(email: string) {
  return post<{ requestId: string }>("/auth/otp/request", { email });
}

/** `POST /api/portal/auth/otp/verify` — on success, the server sets the
 *  httpOnly session cookie; we just cache the member's display info. */
export async function verifyEmailOtp(
  requestId: string,
  otp: string,
): Promise<Envelope<AuthSession>> {
  const result = await post<AuthSession>("/auth/otp/verify", { requestId, otp });
  if (result.success && result.data) {
    storeSession(result.data);
  }
  return result;
}

export async function logout(): Promise<void> {
  clearSession();
  try {
    await fetch("/api/portal/auth/logout", { method: "POST" });
  } catch {
    // Best-effort — the cookie has a hard expiry regardless, and the
    // client-side member cache is already cleared above.
  }
}
