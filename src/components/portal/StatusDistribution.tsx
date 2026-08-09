"use client";

import { motion } from "framer-motion";
import { STATUS_STYLE } from "@/lib/portal/status-style";
import { STATUS_LABEL } from "@/lib/portal/format";
import type { InvoiceStatus } from "@/lib/portal/types";

const ORDER: InvoiceStatus[] = ["draft", "approved", "submitted", "paid", "rejected"];

export function StatusDistribution({ counts }: { counts: Record<InvoiceStatus, number> }) {
  const total = ORDER.reduce((sum, s) => sum + (counts[s] ?? 0), 0) || 1;

  return (
    <div className="dist">
      <div className="dist-bar">
        {ORDER.map((status, i) => {
          const value = counts[status] ?? 0;
          if (value === 0) return null;
          return (
            <motion.span
              key={status}
              className="dist-seg"
              style={{ background: STATUS_STYLE[status].fg }}
              initial={{ width: 0 }}
              animate={{ width: `${(value / total) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              title={`${STATUS_LABEL[status]}: ${value}`}
            />
          );
        })}
      </div>
      <ul className="dist-legend">
        {ORDER.map((status) => (
          <li key={status}>
            <span className="dist-dot" style={{ background: STATUS_STYLE[status].fg }} />
            <span className="muted">{STATUS_LABEL[status]}</span>
            <strong className="tnum">{counts[status] ?? 0}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
