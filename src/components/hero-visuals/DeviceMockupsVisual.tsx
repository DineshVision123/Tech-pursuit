'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, MessageSquare, Home, BarChart2, Settings } from 'lucide-react';

/** Formats large values compactly ("128.4k") so a KPI card never overflows its own width. */
function formatCompact(value: number, suffix: string): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k${suffix}`;
  return `${value.toLocaleString()}${suffix}`;
}

/** Ticking KPI number — mimics a live dashboard metric nudging upward every few seconds. */
function TickingKpi({
  label,
  start,
  min = 1,
  max = 4,
  prefix = '',
  suffix = '',
}: {
  readonly label: string;
  readonly start: number;
  readonly min?: number;
  readonly max?: number;
  readonly prefix?: string;
  readonly suffix?: string;
}) {
  const [value, setValue] = useState(start);

  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => v + Math.round(min + Math.random() * (max - min)));
    }, 2400 + Math.random() * 800);
    return () => clearInterval(id);
  }, [min, max]);

  return (
    <div className="min-w-0 rounded-lg bg-white/[0.06] px-2 py-1.5">
      <p className="truncate text-[7.5px] font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <div className="mt-0.5 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="whitespace-nowrap text-[11px] font-bold text-white"
          >
            {prefix}
            {formatCompact(value, suffix)}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

const CHART_A = 'M0,32 L14,26 L28,30 L42,17 L56,22 L70,10 L84,16 L98,6';
const CHART_B = 'M0,26 L14,19 L28,24 L42,12 L56,27 L70,16 L84,7 L98,13';

/** Animated line chart — the two paths share point structure so Framer can morph between them. */
function MiniChart() {
  return (
    <svg viewBox="0 0 98 40" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="dm-chart" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b7cf0" />
          <stop offset="100%" stopColor="#f8a13f" />
        </linearGradient>
      </defs>
      <motion.path
        animate={{ d: [CHART_A, CHART_B, CHART_A] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        fill="none"
        stroke="url(#dm-chart)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const barSets: readonly (readonly number[])[] = [
  [40, 70, 55, 85],
  [60, 45, 80, 50],
];
const barLabels = ['Signups', 'Retention'];

function DesktopScreen() {
  return (
    <div className="flex h-full flex-col bg-ink-950">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
        <div className="flex gap-3 text-[8.5px] font-medium text-ink-400">
          <span className="text-white">Overview</span>
          <span>Revenue</span>
          <span>Users</span>
        </div>
        <div className="relative ml-auto">
          <Bell size={11} className="text-ink-400" />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-gold-400" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2.5">
        <TickingKpi label="Revenue" start={128400} min={40} max={340} prefix="$" />
        <TickingKpi label="Active Users" start={9280} min={2} max={14} />
        <div className="min-w-0 rounded-lg bg-white/[0.06] px-2 py-1.5">
          <p className="truncate text-[7.5px] font-medium uppercase tracking-wide text-ink-400">Uptime</p>
          <p className="truncate text-[11px] font-bold text-white">99.98%</p>
        </div>
      </div>
      <div className="flex-1 px-2.5 pb-2.5">
        <div className="h-full rounded-lg bg-white/[0.04] p-2">
          <MiniChart />
        </div>
      </div>
    </div>
  );
}

function TabletScreen() {
  return (
    <div className="flex h-full flex-col bg-ink-950 p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-white">Analytics</p>
        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-brand-500 to-gold-400" />
      </div>
      <div className="mt-2 grid flex-1 grid-cols-2 gap-1.5">
        {barSets.map((bars, i) => (
          <div key={barLabels[i]} className="rounded-lg bg-white/[0.05] p-1.5">
            <p className="text-[7px] text-ink-400">{barLabels[i]}</p>
            <div className="mt-1 flex h-10 items-end gap-0.5">
              {bars.map((h, j) => (
                <motion.div
                  key={j}
                  className="flex-1 rounded-t-[2px] bg-gradient-to-t from-brand-500/70 to-brand-300/70"
                  animate={{ height: [`${h}%`, `${Math.min(100, h + 22)}%`, `${h}%`] }}
                  transition={{ duration: 3.2 + j * 0.25, repeat: Infinity, ease: 'easeInOut', delay: j * 0.15 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="-ml-1.5 h-4 w-4 rounded-full border border-ink-950 bg-gradient-to-br from-brand-400 to-brand-600 first:ml-0"
          />
        ))}
        <span className="ml-1 text-[7px] text-ink-400">Team online</span>
      </div>
    </div>
  );
}

const activity: ReadonlyArray<{ readonly tone: string; readonly amount: string }> = [
  { tone: 'bg-brand-500/70', amount: '+$420' },
  { tone: 'bg-gold-500/70', amount: '+$95' },
  { tone: 'bg-brand-500/40', amount: '+$1.2k' },
];

function PhoneScreen() {
  return (
    <div className="relative flex h-full flex-col bg-ink-950 p-2">
      <div className="flex items-center justify-between px-0.5 py-1">
        <p className="text-[9.5px] font-semibold text-white">Activity</p>
        <div className="h-4 w-4 rounded-full bg-white/10" />
      </div>
      <div className="mt-1 space-y-1">
        {activity.map((a, i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-md bg-white/[0.05] px-1.5 py-1">
            <span className={`h-4 w-4 shrink-0 rounded-full ${a.tone}`} />
            <span className="h-1 flex-1 rounded-full bg-white/20" />
            <span className="text-[7px] font-semibold text-white">{a.amount}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-around border-t border-white/10 px-1 pt-1.5">
        {[Home, BarChart2, MessageSquare, Settings].map((Icon, i) => (
          <Icon key={i} size={11} className={i === 0 ? 'text-brand-300' : 'text-ink-500'} />
        ))}
      </div>

      <motion.div
        className="glass absolute -right-4 top-4 flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 shadow-glow"
        animate={{ x: [26, 0, 0, 26], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut', times: [0, 0.15, 0.85, 1] }}
      >
        <MessageSquare size={11} className="text-brand-300" />
        <span className="text-[8px] font-medium text-white">New order received</span>
      </motion.div>
    </div>
  );
}

/**
 * WORK — three floating, realistic product mockups (desktop dashboard,
 * tablet analytics app, mobile activity feed) with live-feeling data:
 * ticking KPI numbers, a morphing line chart, animated bars, and a
 * transient notification toast. Floats directly over the hero's ambient
 * backdrop — no enclosing panel — with a slight independent tilt/bob per
 * device for depth.
 */
export function DeviceMockupsVisual() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-[6%] top-[6%] h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="absolute bottom-[4%] right-[4%] h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />

      {/* Desktop — back layer */}
      <div className="absolute left-[4%] top-[10%] w-[66%]" style={{ transform: 'rotate(-2.5deg)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: [0, -9, 0] }}
          transition={{
            opacity: { duration: 0.6 },
            y: { duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
          }}
          className="overflow-hidden rounded-xl border border-white/10 shadow-glow"
        >
          <div className="flex items-center gap-1 bg-ink-900 px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          </div>
          <div className="aspect-[16/10]">
            <DesktopScreen />
          </div>
        </motion.div>
      </div>

      {/* Tablet — mid layer */}
      <div className="absolute bottom-[16%] left-[42%] z-10 w-[36%]" style={{ transform: 'rotate(3deg)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: [0, -13, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.15 },
            y: { duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 },
          }}
          className="overflow-hidden rounded-2xl border border-white/10 p-1.5 shadow-glow"
          style={{ backgroundColor: '#05070d' }}
        >
          <div className="aspect-[3/4] overflow-hidden rounded-lg">
            <TabletScreen />
          </div>
        </motion.div>
      </div>

      {/* Phone — front layer */}
      <div className="absolute bottom-[6%] right-[6%] z-20 w-[22%]" style={{ transform: 'rotate(-4deg)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: [0, -7, 0] }}
          transition={{
            opacity: { duration: 0.6, delay: 0.3 },
            y: { duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
          }}
          className="overflow-hidden rounded-[20px] border border-white/10 p-1.5 shadow-glow"
          style={{ backgroundColor: '#05070d' }}
        >
          <div className="aspect-[9/18] overflow-hidden rounded-[14px]">
            <PhoneScreen />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
