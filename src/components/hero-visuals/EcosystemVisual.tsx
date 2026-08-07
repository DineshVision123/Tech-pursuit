'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Landmark,
  HeartPulse,
  ShoppingBag,
  Truck,
  Factory,
  GraduationCap,
  Building2,
  Plane,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const industries: ReadonlyArray<{ readonly icon: LucideIcon; readonly label: string }> = [
  { icon: Landmark, label: 'Finance' },
  { icon: HeartPulse, label: 'Healthcare' },
  { icon: ShoppingBag, label: 'Retail' },
  { icon: Truck, label: 'Logistics' },
  { icon: Factory, label: 'Manufacturing' },
  { icon: GraduationCap, label: 'Education' },
  { icon: Building2, label: 'Real Estate' },
  { icon: Plane, label: 'Travel' },
];

// Every industry sits on the exact same circle, at the exact same angular
// step — the only inputs are count and radius, so spacing and spoke length
// are mathematically guaranteed equal, never hand-placed.
const STEP = 360 / industries.length;
const RING_RADIUS = 39; // percent of the ring box's own width — same box, same math, every node
const ACCENT_COUNT = industries.length;
const ACCENT_RADIUS = 46;

// Rounded before it ever reaches a template string / style attribute — raw
// Math.cos/Math.sin floats can stringify with a different trailing digit
// between the server's V8 build and the browser's, which fails hydration
// even though the values are numerically identical.
function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function polar(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: round(50 + Math.cos(rad) * radius), y: round(50 + Math.sin(rad) * radius) };
}

/**
 * INDUSTRIES — the real Tech Pursuit Systems mark at the center of a
 * mathematically exact orbit: every industry icon sits on one circle
 * (`RING_RADIUS`), one fixed angular step apart, so every spoke is
 * identical in length and every gap identical in angle. The ring box is
 * always square (`aspect-square`, sized off the hero panel's own width —
 * its constraining dimension) so the circle is a true circle regardless of
 * the panel's own aspect ratio, never an ellipse. A slower, larger accent
 * ring (same square-box technique, its own even spacing) sits behind it for
 * depth, plus a faint outermost guide ring. Floats over the ambient
 * backdrop — no enclosing panel.
 */
export function EcosystemVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="absolute aspect-square w-[90%] rounded-full bg-brand-500/12 blur-3xl" />
      <div className="absolute aspect-square w-[55%] rounded-full bg-gold-500/8 blur-3xl" />

      {/* Outermost guide ring — very faint, pure depth, no content */}
      <div className="absolute aspect-square w-[100%]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={49} fill="none" stroke="rgba(61,124,240,0.07)" strokeWidth={0.4} />
        </svg>
      </div>

      {/* Outer accent orbit — same square-box math, evenly spaced, slower + reverse */}
      <motion.div
        className="absolute aspect-square w-[94%]"
        animate={{ rotate: -360 }}
        transition={{ duration: 170, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={ACCENT_RADIUS} fill="none" stroke="rgba(61,124,240,0.16)" strokeWidth={0.5} strokeDasharray="1.4 3" />
        </svg>
        {Array.from({ length: ACCENT_COUNT }, (_, i) => {
          const angle = i * (360 / ACCENT_COUNT) + STEP / 2;
          const p = polar(ACCENT_RADIUS, angle);
          return (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <span className="block h-2 w-2 rounded-full bg-brand-400/60 blur-[1px]" />
            </div>
          );
        })}
      </motion.div>

      {/* Inner ring — industry icons, one circle, one fixed angular step */}
      <motion.div
        className="absolute aspect-square w-[78%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 130, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          {industries.map((_, i) => {
            const p = polar(RING_RADIUS, i * STEP);
            return (
              <line
                key={i}
                x1={50}
                y1={50}
                x2={p.x}
                y2={p.y}
                stroke="rgba(61,124,240,0.26)"
                strokeWidth={0.45}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {industries.map(({ icon: Icon, label }, i) => {
          const p = polar(RING_RADIUS, i * STEP);
          return (
            <div key={label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 130, repeat: Infinity, ease: 'linear' }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-brand-400/45 bg-white/[0.07] text-brand-200 shadow-glow backdrop-blur-md">
                  <Icon size={32} strokeWidth={1.7} />
                </div>
                <span className="type-small font-medium text-ink-200">{label}</span>
              </motion.div>
            </div>
          );
        })}

        {/* Data pulses — one per industry, identical reach, evenly staggered */}
        {industries.map((_, i) => {
          const rad = (i * STEP * Math.PI) / 180;
          return (
            <div key={i} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.span
                className="block h-1.5 w-1.5 rounded-full bg-gold-400"
                animate={{
                  x: [0, round(Math.cos(rad) * (RING_RADIUS * 3.4))],
                  y: [0, round(Math.sin(rad) * (RING_RADIUS * 3.4))],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 2.8, repeat: Infinity, delay: i * (2.8 / industries.length), ease: 'easeInOut' }}
              />
            </div>
          );
        })}
      </motion.div>

      {/* Fixed center — real logo mark, outside every rotating frame */}
      <motion.div
        animate={{ scale: [1, 1.045, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-glow"
      >
        <Image
          src="/logo-mark.png"
          alt="Tech Pursuit Systems"
          width={66}
          height={54}
          className="object-contain"
          priority
        />
      </motion.div>
    </div>
  );
}
