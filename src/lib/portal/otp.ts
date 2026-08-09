import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/** 6-digit numeric code, zero-padded (e.g. "004821"). */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** `scryptSync` with a random per-code salt, stored alongside the hash as
 *  `salt:hash` — no extra column needed, and no new dependency (bcrypt)
 *  for something this short-lived (10-minute expiry, see the request route). */
export function hashOtpCode(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyOtpCode(code: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(code, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/** Opaque session token — 32 bytes of real entropy, hex-encoded. Looked up
 *  server-side against the `sessions` table; never a signed/decodable JWT,
 *  so there's no secret to manage and logout is a one-row delete. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
