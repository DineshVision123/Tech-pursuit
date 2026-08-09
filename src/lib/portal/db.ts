import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * The invoice portal's own Neon Postgres — deliberately a *separate*
 * database from anything else this app talks to (the marketing site itself
 * has no database at all). Never imported from marketing-site code; only
 * from `src/lib/portal/**` and `src/app/api/portal/**`.
 *
 * Lazily constructed on first actual query, not at module import time —
 * `neon()` validates the connection string eagerly and throws immediately
 * if it's missing/empty. Since this module is imported (transitively) by
 * every `/api/portal/**` route handler, a top-level `neon(...)` call would
 * crash `next build`'s page-data-collection step on any machine without
 * `DATABASE_URL` set (e.g. before it's configured in Vercel), even though
 * no query has actually run yet. Deferring construction means a missing
 * connection string only fails when a route is actually invoked — the
 * correct time for that failure to surface.
 */
let cached: NeonQueryFunction<false, false> | undefined;

function getSql(): NeonQueryFunction<false, false> {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. The invoice portal needs its own Neon Postgres " +
          "connection string in .env.local — see .env.example.",
      );
    }
    cached = neon(url);
  }
  return cached;
}

/** Tagged-template SQL — `sql\`select * from x where id = ${id}\``, safely
 *  parameterized by the driver (never string-concatenated). */
export const sql: NeonQueryFunction<false, false> = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  getSql()(strings, ...values)) as NeonQueryFunction<false, false>;
