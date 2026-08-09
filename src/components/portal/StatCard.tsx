"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { revealItem } from "./Reveal";

export function StatCard({
  label,
  value,
  format,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: LucideIcon;
  accent: string;
  sub?: string;
}) {
  return (
    <motion.div
      variants={revealItem}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="card stat-card"
    >
      <div className="stat-top">
        <span className="stat-icon" style={{ color: accent, background: `${accent}1a` }}>
          <Icon size={18} strokeWidth={2.2} />
        </span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">
        <AnimatedNumber value={value} format={format} />
      </div>
      {sub && <div className="stat-sub muted-3">{sub}</div>}
      <span className="stat-bar" style={{ background: accent }} />
    </motion.div>
  );
}
