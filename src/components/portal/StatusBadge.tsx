"use client";

import { motion } from "framer-motion";
import { STATUS_STYLE } from "@/lib/portal/status-style";
import { STATUS_LABEL } from "@/lib/portal/format";
import type { InvoiceStatus } from "@/lib/portal/types";

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { fg, bg } = STATUS_STYLE[status];
  return (
    <motion.span
      className="pill"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 26 }}
      style={{ color: fg, background: bg }}
    >
      {STATUS_LABEL[status]}
    </motion.span>
  );
}
