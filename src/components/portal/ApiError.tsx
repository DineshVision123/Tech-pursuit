import { PlugZap } from "lucide-react";

/** Shown when a server query (`lib/portal/queries.ts`) can't reach Postgres. */
export function ApiError({ message }: { message: string }) {
  return (
    <div className="card api-error">
      <span className="api-error-icon">
        <PlugZap size={22} />
      </span>
      <div>
        <h3>Can&apos;t reach the database</h3>
        <p className="muted">{message}</p>
        <p className="muted-3">
          Check that <code>DATABASE_URL</code> is set in <code>.env.local</code> and points at a
          reachable Neon Postgres instance, then reload.
        </p>
      </div>
    </div>
  );
}
