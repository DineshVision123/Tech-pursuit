"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

/**
 * Routes within `/portal/**` that render standalone (no sidebar/topbar
 * chrome) — just `/portal/login`. The public `/pay/[token]` page lives
 * entirely outside `/portal` now (see `src/app/pay/[token]/page.tsx`), so
 * `AppShell` never mounts for it at all — no entry needed here for it.
 */
const PUBLIC_ROUTES = ["/portal/login"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="vs-shell">
      <Sidebar />
      <div className="vs-main">
        <TopBar />
        <main className="vs-content">
          {/* A quick crossfade between routes — deliberately just opacity, no
           *  y-offset, so it reads as continuity rather than competing with
           *  each page's own richer entrance choreography (RevealItem etc). */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
