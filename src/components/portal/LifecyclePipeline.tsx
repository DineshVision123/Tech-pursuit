"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { STATUS_LABEL } from "@/lib/portal/format";
import type { InvoiceStatus } from "@/lib/portal/types";

const STEPS: InvoiceStatus[] = ["draft", "approved", "submitted", "paid"];

/**
 * Horizontal lifecycle stepper (Report §4). The progress line fills to the
 * current stage; a rejected invoice shows a distinct rose state instead.
 */
export function LifecyclePipeline({ status }: { status: InvoiceStatus }) {
  const rejected = status === "rejected";
  const activeIndex = rejected ? 0 : STEPS.indexOf(status);
  const fillPct = rejected ? 0 : (activeIndex / (STEPS.length - 1)) * 100;

  return (
    <div className={`pipeline${rejected ? " is-rejected" : ""}`}>
      <div className="pipeline-track">
        <motion.div
          className="pipeline-fill"
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="pipeline-steps">
        {STEPS.map((step, i) => {
          const done = !rejected && i <= activeIndex;
          const current = !rejected && i === activeIndex;
          return (
            <div key={step} className="pipeline-step">
              <motion.span
                className={`pipeline-node${done ? " done" : ""}${current ? " current" : ""}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 400, damping: 20 }}
              >
                {done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </motion.span>
              <span className={`pipeline-label${current ? " current" : ""}`}>
                {STATUS_LABEL[step]}
              </span>
            </div>
          );
        })}
      </div>

      {rejected && (
        <motion.div
          className="pipeline-rejected"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="pipeline-rejected-badge">
            <X size={13} strokeWidth={3} />
          </span>
          Rejected — sent back for correction. Edit and it returns to Draft.
        </motion.div>
      )}
    </div>
  );
}
