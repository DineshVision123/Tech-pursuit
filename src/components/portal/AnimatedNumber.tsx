"use client";

import { useEffect } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

/**
 * Springy count-up. `format` maps the raw number → display string, so the
 * same component drives money tiles (cents → "$1,234.56") and plain counts.
 */
export function AnimatedNumber({
  value,
  format,
  durationMs = 900,
}: {
  value: number;
  format: (n: number) => string;
  durationMs?: number;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (latest) => format(Math.round(latest)));

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [mv, value, durationMs]);

  return <motion.span className="tnum">{text}</motion.span>;
}
