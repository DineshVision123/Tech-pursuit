"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Staggered fade-up entrance. Wrap a list; children use <RevealItem>. */
export function Reveal({
  children,
  className,
  stagger = 0.06,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const revealItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 30 },
  },
};

export function RevealItem({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Self-animates when standalone; still composes under a <Reveal> parent
  // because the "hidden"/"show" labels match the parent's orchestration.
  return (
    <motion.div
      variants={revealItem}
      initial="hidden"
      animate="show"
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
