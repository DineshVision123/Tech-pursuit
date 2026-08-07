'use client';

import { motion } from 'framer-motion';
import { Rocket, Users, Sparkles, TrendingUp, Award } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const milestones: ReadonlyArray<{ readonly icon: LucideIcon; readonly label: string; readonly detail: string }> = [
  { icon: Rocket, label: 'Founded', detail: 'Started as a small product engineering team' },
  { icon: Users, label: 'First enterprise client', detail: 'Scaled delivery beyond the founders' },
  { icon: Sparkles, label: 'Applied AI practice', detail: 'AI/ML added into every engagement' },
  { icon: TrendingUp, label: '120+ products shipped', detail: 'Across fintech, health, retail, logistics' },
  { icon: Award, label: 'Platform partner', detail: 'Long-term, retained engineering teams' },
];

/**
 * ABOUT — a vertical innovation timeline: floating milestone cards on a
 * faint blueprint grid, connected by a soft vertical line. Reinforces the
 * page's "how we got here" narrative rather than decorating it.
 */
export function InnovationTimelineVisual() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-ink-950 px-7 py-8">
      <div className="absolute inset-0 bg-grid-glow opacity-70" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(61,124,240,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(61,124,240,0.7) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative flex h-full flex-col justify-between">
        <div className="pointer-events-none absolute left-[21px] top-[22px] bottom-[22px] w-px bg-gradient-to-b from-brand-400/50 via-brand-400/15 to-transparent" />
        {milestones.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 0.5, delay: i * 0.12 },
              x: { duration: 0.5, delay: i * 0.12 },
              y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: 0.6 + i * 0.3 },
            }}
            className="glass relative z-10 flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300">
              <m.icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="type-badge text-white">{m.label}</p>
              <p className="type-small mt-0.5 truncate text-ink-300">{m.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
