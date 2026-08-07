'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Rocket, ShieldCheck, Users2, Gauge } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';
import { GradientBlob } from '@/components/ui/GradientBlob';
import { fadeUp, fadeIn, staggerContainer, viewportOnce } from '@/lib/motion';

const reasons = [
  {
    icon: Rocket,
    title: 'Ship velocity',
    body: 'Two-week cycles with visible progress — not quarterly reveals.',
  },
  {
    icon: ShieldCheck,
    title: 'Engineering rigor',
    body: 'Code review, testing, and security baked into every sprint.',
  },
  {
    icon: Users2,
    title: 'Senior-only teams',
    body: 'You work directly with the engineers building your product.',
  },
  {
    icon: Gauge,
    title: 'Built to scale',
    body: 'Architecture decisions made for your next round of growth, not just this one.',
  },
];

/**
 * Text + reason grid on the left, a real team photo on the right —
 * asymmetric, distinct from the grid pattern used elsewhere. Deliberately
 * compact: this section shouldn't need scrolling to see end-to-end.
 */
export function WhyChoose() {
  return (
    <section className="relative bg-ink-950 py-6 text-white md:py-8 lg:py-10">
      <div className="absolute inset-0 bg-brand-radial opacity-60" />
      <div className="container-content relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          <Reveal>
            <span className="eyebrow">Why Tech Pursuit</span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="type-section mt-4">Software partners who think like founders</h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="type-body mt-4 text-ink-300">
              We’ve been on the other side of the table — shipping products under
              real deadlines, real budgets, real stakes. That’s the lens we bring
              to your roadmap.
            </p>
          </Reveal>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={staggerContainer(0.1)}
            className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {reasons.map((reason) => (
              <motion.div
                key={reason.title}
                variants={fadeUp}
                className="glass rounded-2xl p-4 transition-colors hover:border-white/20"
              >
                <reason.icon size={20} className="text-gold-400" strokeWidth={1.6} />
                <h3 className="type-card mt-3 text-white">{reason.title}</h3>
                <p className="type-small mt-1 text-ink-300">{reason.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={fadeIn}
          className="relative"
        >
          <GradientBlob tone="gold" className="right-[-10%] top-[-10%] h-[280px] w-[280px]" />
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10 shadow-glow">
            <Image
              src="/images/home/why-choose-team.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
