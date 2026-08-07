'use client';

import { useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Target,
  Sparkles,
  Layers,
  Gauge,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/cn';

type Step = { readonly icon: LucideIcon; readonly title: string; readonly body: string };

const steps: readonly Step[] = [
  {
    icon: Search,
    title: 'Discover & Understand',
    body: 'We start by understanding your business, users, and constraints — before proposing a solution.',
  },
  {
    icon: Target,
    title: 'Strategy & Planning',
    body: 'Clear scope, milestones, and technical direction — agreed before any work begins.',
  },
  {
    icon: Sparkles,
    title: 'Design & Innovation',
    body: 'Solutions shaped around real user needs and emerging technology, not a checklist.',
  },
  {
    icon: Layers,
    title: 'Build & Integrate',
    body: 'Senior engineers deliver in short cycles, integrated with the systems you already run.',
  },
  {
    icon: Gauge,
    title: 'Optimize & Validate',
    body: 'Every release is measured against real usage, performance, and business outcomes.',
  },
  {
    icon: TrendingUp,
    title: 'Scale & Evolve',
    body: 'Architecture and support that keep pace as you grow — this doesn’t end at handoff.',
  },
];

const principles = ['Collaborative', 'Transparent', 'Agile', 'Outcome-Driven'];

const expandTransition = { duration: 0.45, ease: [0.16, 1, 0.3, 1] } as const;

// Cards sit under a stationary cursor while the page scrolls, so plain
// mouseenter/mouseleave fire in rapid succession and the expand/collapse
// looks like it's stuttering. Debouncing the hover intent lets it settle
// on whichever card the cursor actually stops over.
const HOVER_INTENT_DELAY = 220;

/**
 * "How we work" — a compact, hover-driven 6-step process. The timeline
 * (connector + nodes) lives in its own column so it never collides with
 * card content; only the hovered card expands, so the section's height
 * never grows beyond one card's worth of extra room.
 */
export function OurProcess() {
  const [active, setActive] = useState<number | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestActive = (index: number | null) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setActive(index);
    }, HOVER_INTENT_DELAY);
  };

  return (
    <section className="relative overflow-hidden bg-white py-6 text-ink-900 md:py-8 lg:py-10">
      <div className="absolute inset-0 bg-grid-glow opacity-40" />
      <div className="container-content relative grid grid-cols-1 gap-10 lg:grid-cols-[40%_1fr] lg:gap-12">
        {/* Left — sticky, never moves */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <span className="eyebrow">Our Process</span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="type-section mt-4">
              A proven process.
              <br />
              Built for business impact.
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="type-body mt-4 text-ink-500">
              We combine strategy, engineering, AI, cloud, and continuous innovation to
              help organizations solve complex business challenges and accelerate growth.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-6">
              <MagneticButton href="/contact">Let’s Build Together</MagneticButton>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap gap-2 border-t border-ink-900/10 pt-6">
              {principles.map((p) => (
                <motion.span
                  key={p}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="glass-light type-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink-600 shadow-card transition-colors duration-300 hover:border-brand-400/40 hover:text-ink-900"
                >
                  <CheckCircle2 size={13} className="text-brand-500" />
                  {p}
                </motion.span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Timeline column + card column, sharing grid rows so nodes always align to their card */}
        <div className="grid grid-cols-[28px_1fr] gap-x-14">
          {steps.flatMap((step, i) => [
            <TimelineNode
              key={`node-${i}`}
              isActive={active === i}
              isFirst={i === 0}
              isLast={i === steps.length - 1}
            />,
            <ProcessCard
              key={`card-${i}`}
              step={step}
              index={i}
              isActive={active === i}
              onHoverStart={() => requestActive(i)}
              onHoverEnd={() => requestActive(null)}
            />,
          ])}
        </div>
      </div>
    </section>
  );
}

function TimelineNode({
  isActive,
  isFirst,
  isLast,
}: {
  readonly isActive: boolean;
  readonly isFirst: boolean;
  readonly isLast: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center">
      <div
        className={cn(
          'w-0.5 flex-1 rounded-full',
          isFirst ? 'bg-transparent' : 'bg-gradient-to-b from-brand-500/15 to-brand-400/40',
        )}
      />
      <motion.span
        className={cn(
          'relative z-10 my-1 block h-3.5 w-3.5 shrink-0 rounded-full border-2 transition-colors duration-300',
          isActive ? 'border-brand-400 bg-brand-400' : 'border-ink-900/20 bg-white',
        )}
        animate={isActive ? { scale: [1, 1.35, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <AnimatePresence>
          {isActive && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25 }}
              className="absolute -inset-2 rounded-full bg-brand-400/40 blur-md"
            />
          )}
        </AnimatePresence>
      </motion.span>
      <div
        className={cn(
          'w-0.5 flex-1 rounded-full',
          isLast ? 'bg-transparent' : 'bg-gradient-to-b from-brand-400/40 to-brand-500/15',
        )}
      />
    </div>
  );
}

function ProcessCard({
  step,
  index,
  isActive,
  onHoverStart,
  onHoverEnd,
}: {
  readonly step: Step;
  readonly index: number;
  readonly isActive: boolean;
  readonly onHoverStart: () => void;
  readonly onHoverEnd: () => void;
}): ReactNode {
  return (
    <motion.div
      layout
      transition={{ layout: expandTransition }}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      tabIndex={0}
      className={cn(
        'btn-focus relative mb-2 cursor-default rounded-2xl border p-3.5 transition-all duration-300',
        isActive
          ? 'border-brand-400/40 bg-gradient-to-br from-brand-50 to-white shadow-card'
          : 'border-ink-900/[0.07] bg-surface-soft hover:border-ink-900/15 hover:bg-white',
      )}
    >
      {/* Hover target is the title text only — the icon, the number, and the
          empty space around them stay "dead" so drifting the cursor past
          them (e.g. while scrolling) can't trigger the expand. */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300',
            isActive
              ? 'bg-gradient-to-br from-brand-500 to-gold-400 text-white shadow-glow'
              : 'bg-ink-900/5 text-ink-400',
          )}
        >
          <step.icon size={16} strokeWidth={1.8} />
        </div>
        <h3
          onMouseEnter={onHoverStart}
          onMouseLeave={onHoverEnd}
          className={cn(
            'type-secondary inline-block font-semibold transition-colors duration-300',
            isActive ? 'text-ink-900' : 'text-ink-600',
          )}
        >
          {step.title}
        </h3>
        <div className="flex-1" />
        <span
          className={cn(
            'type-badge shrink-0 transition-colors duration-300',
            isActive ? 'text-gold-600' : 'text-ink-400',
          )}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div
        className={cn(
          'mt-2.5 h-0.5 w-6 rounded-full bg-gradient-to-r from-brand-400 to-gold-400 transition-opacity duration-300',
          isActive ? 'opacity-100' : 'opacity-35',
        )}
      />

      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -4 }}
            transition={expandTransition}
            className="overflow-hidden"
          >
            <p className="type-small mt-2.5 text-ink-500">{step.body}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
