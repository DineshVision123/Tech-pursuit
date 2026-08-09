"use client";

import { motion } from "framer-motion";
import { formatDate, fromNow, humanizeAction } from "@/lib/portal/format";
import type { AuditEntry } from "@/lib/portal/types";

export function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) return <p className="muted-3">No audit entries.</p>;
  return (
    <ol className="timeline">
      {entries.map((e, i) => (
        <motion.li
          key={e.id}
          className="timeline-item"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 * i }}
        >
          <span className="timeline-dot" />
          <div>
            <p className="timeline-title">
              {humanizeAction(e.action)}
              {e.reason ? <span className="muted-3"> — {e.reason}</span> : null}
            </p>
            <p className="muted-3 timeline-meta">
              {e.actor} · <time title={formatDate(e.at)}>{fromNow(e.at)}</time>
            </p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
