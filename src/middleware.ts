import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/portal/session";

/**
 * Ported from invoice-web's dead `src/proxy.ts` (a file Next.js never
 * actually invoked — middleware only runs from a file literally named
 * `middleware.ts` at the project root). Scoped to `/portal/**` only via the
 * matcher below — the marketing site and the public `/pay/[token]` page are
 * never touched by this.
 *
 * This is a UX redirect only, not the real security boundary — presence of
 * the cookie just means "looks logged in enough to skip the login screen."
 * Actual authorization happens per-request in every `/api/portal/**` route
 * handler and server query (`getCurrentMember()` in
 * `src/lib/portal/auth-server.ts`), which verifies the session token
 * against the database regardless of what this middleware decided.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);
  const isLoginPage = pathname === "/portal/login";

  if (!hasSessionCookie && !isLoginPage) {
    const loginUrl = new URL("/portal/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSessionCookie && isLoginPage) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};
