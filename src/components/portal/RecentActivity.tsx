"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { fromNow, humanizeAction } from "@/lib/portal/format";
import type { DashboardSummary } from "@/lib/portal/types";

export function RecentActivity({ items }: { items: DashboardSummary["recentActivity"] }) {
  if (items.length === 0) {
    return <p className="muted-3">No activity yet.</p>;
  }
  return (
    <ul className="feed">
      {items.map((item, i) => (
        <motion.li
          key={`${item.at}-${i}`}
          className="feed-item"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }}
        >
          <span className="feed-icon">
            <Activity size={14} strokeWidth={2.2} />
          </span>
          <div className="feed-body">
            <p>
              <strong>{item.actor.split("@")[0]}</strong> {humanizeAction(item.action)}
              {item.reason ? <span className="muted-3"> — {item.reason}</span> : null}
            </p>
            <time className="muted-3">{fromNow(item.at)}</time>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
