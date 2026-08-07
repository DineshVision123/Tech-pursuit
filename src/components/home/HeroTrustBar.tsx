'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Marquee } from '@/components/ui/Marquee';
import { fadeIn, fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

const stats = [
  { value: 120, suffix: '+', label: 'Products shipped' },
  { value: 98, suffix: '%', label: 'Client retention' },
  { value: 14, suffix: '', label: 'Years combined leadership' },
];

/**
 * PLACEHOLDER — invented names, not real clients. Swap for actual client
 * wordmarks (as logo SVGs, ideally) before this ships publicly.
 */
const trustedPartners = [
  'Northwind Retail',
  'Ledgerline Financial',
  'Cascade Health Group',
  'Aeroview Logistics',
  'Solstice Energy',
  'Brightfield Manufacturing',
  'Meridian Capital Partners',
  'Summit Ridge Holdings',
  'Vantage Point Media',
  'Sterling & Cross Insurance',
];

/**
 * Trusted-by marquee + headline stats — previously the bottom of the
 * homepage hero itself, split out into its own normal-flow section so the
 * hero above can stay locked to exactly one screen (see `Hero.tsx`).
 * Animates in on scroll like every other below-the-fold section, rather
 * than on mount.
 */
export function HeroTrustBar() {
  return (
    <section className="relative bg-white pb-10 pt-8 md:pb-12">
      <div className="container-content">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={fadeIn}
          className="border-t border-ink-900/10 pt-5"
        >
          <p className="type-badge text-center text-ink-500">Trusted by teams at</p>
          <div className="mt-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <Marquee durationSeconds={26}>
              {trustedPartners.map((name) => (
                <span
                  key={name}
                  className="type-badge whitespace-nowrap text-ink-600/80 transition-colors hover:text-ink-900"
                >
                  {name}
                </span>
              ))}
            </Marquee>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="mt-10 grid grid-cols-1 gap-8 border-t border-ink-900/10 pt-6 sm:grid-cols-3"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp}>
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                className="type-heading font-display text-ink-950"
              />
              <p className="type-small mt-1.5 text-ink-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
