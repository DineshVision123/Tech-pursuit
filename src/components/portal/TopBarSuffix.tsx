"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Lets a deeply-nested page (e.g. the invoice form) put a bit of text next
 * to `TopBar`'s route-based title — "New invoice · INV-111" — without
 * TopBar needing to know anything about invoices. `AppShell` renders
 * `TopBar` as a layout-level sibling of the routed page content, so this is
 * the one shared ancestor a page component can reach through.
 */
const TopBarSuffixContext = createContext<{
  suffix: string | null;
  setSuffix: (s: string | null) => void;
} | null>(null);

export function TopBarSuffixProvider({ children }: { children: ReactNode }) {
  const [suffix, setSuffix] = useState<string | null>(null);
  const value = useMemo(() => ({ suffix, setSuffix }), [suffix]);
  return <TopBarSuffixContext.Provider value={value}>{children}</TopBarSuffixContext.Provider>;
}

export function useTopBarSuffix(): string | null {
  return useContext(TopBarSuffixContext)?.suffix ?? null;
}

/** Call from a page to publish its suffix; clears itself on unmount/route
 *  change so a stale invoice number never lingers into the next page. */
export function useSetTopBarSuffix(suffix: string | null) {
  const ctx = useContext(TopBarSuffixContext);
  useEffect(() => {
    ctx?.setSuffix(suffix);
    return () => ctx?.setSuffix(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suffix]);
}
