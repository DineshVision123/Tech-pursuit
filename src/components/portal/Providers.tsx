"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { TopBarSuffixProvider } from "./TopBarSuffix";

/**
 * Global motion config. `reducedMotion="user"` makes framer-motion skip
 * transform/opacity enter animations for viewers with
 * `prefers-reduced-motion: reduce`, rendering elements straight to their
 * final state — the accessible default, and what keeps content from getting
 * stuck at `initial` opacity for anyone who opts out of motion.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TopBarSuffixProvider>{children}</TopBarSuffixProvider>
    </MotionConfig>
  );
}
