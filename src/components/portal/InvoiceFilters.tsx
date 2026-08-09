"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { STATUS_STYLE } from "@/lib/portal/status-style";
import { STATUS_LABEL } from "@/lib/portal/format";
import type { InvoiceStatus } from "@/lib/portal/types";

const STATUSES: (InvoiceStatus | "all")[] = [
  "all",
  "draft",
  "approved",
  "submitted",
  "paid",
  "rejected",
];

/** How long to wait after the user stops typing before updating the URL
 *  (and so re-querying the server) — avoids a request per keystroke across
 *  100+ invoices. */
const SEARCH_DEBOUNCE_MS = 350;

export function InvoiceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = (params.get("status") as InvoiceStatus | null) ?? "all";

  const select = (status: InvoiceStatus | "all") => {
    const next = new URLSearchParams(params.toString());
    if (status === "all") next.delete("status");
    else next.set("status", status);
    router.push(`${pathname}?${next.toString()}`);
  };

  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  // Keep the input in sync if the URL changes from elsewhere (back/forward
  // nav). Deferred so React doesn't see a synchronous set during commit
  // (react-hooks/set-state-in-effect).
  useEffect(() => {
    queueMicrotask(() => setQuery(urlQuery));
  }, [urlQuery]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === urlQuery) return;
    const id = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      router.push(`${pathname}?${next.toString()}`);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="row wrap-gap" style={{ gap: "0.75rem", alignItems: "center" }}>
      <div className="search-box">
        <Search size={15} className="muted-3" />
        <input
          type="text"
          placeholder="Search invoice number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          aria-label="Search by invoice number"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="search-clear"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="filters">
        {STATUSES.map((status) => {
          const isActive = active === status;
          const style =
            status === "all"
              ? { fg: "var(--portal-accent-deep)", bg: "var(--portal-accent-soft)" }
              : STATUS_STYLE[status];
          return (
            <button
              key={status}
              className={`filter-chip${isActive ? " is-active" : ""}`}
              onClick={() => select(status)}
              style={
                isActive
                  ? { color: style.fg, background: style.bg, borderColor: "transparent" }
                  : undefined
              }
            >
              {isActive && (
                <motion.span
                  layoutId="filter-active"
                  className="filter-active"
                  style={{ background: style.bg }}
                  transition={{ type: "spring", stiffness: 450, damping: 34 }}
                />
              )}
              <span className="filter-label">
                {status === "all" ? "All" : STATUS_LABEL[status]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
