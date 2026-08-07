'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { fadeUp, staggerContainer } from '@/lib/motion';

/**
 * Full-bleed looping brand video behind the entire hero (text included).
 * The clip is bright/light itself, so — same rule as PageHero's
 * `backgroundVideo` — no dark wash, gradient, or noise layer sits between
 * the video and the text. The video's own color carries the section, and
 * copy below uses dark ink tones instead of the site's usual white-on-dark
 * hero text so it stays readable directly against that light footage.
 *
 * The cube/logo cluster sits at the horizontal center of the source
 * footage. From `md` up, `scale-[1.15]` gives the crop some slack and
 * `object-[8%_50%]` keeps the *left* edge of the footage anchored
 * (cropping the right edge instead) — counter-intuitively, that's what
 * pushes the cluster to read on the *right* side of the visible frame,
 * leaving the left side clear for the headline, and trims off the
 * floating cubes that were crowding the right edge. Nudge that first
 * percentage down further (e.g. '0%') to crop even more off the right, or
 * up toward '50%' to bring it back to center.
 *
 * Below `md` this shift is deliberately NOT applied — on a narrow
 * portrait phone screen there's no left/right split to preserve, and the
 * shifted crop was leaving a gap of bare page background down one edge.
 * Mobile just gets a plain, fully-covering, centered video instead.
 */
function HeroVideoBackground() {
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover md:scale-[1.15] md:object-[8%_50%]"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
    >
      <source src="/videos/home-hero-glass.mp4" type="video/mp4" />
    </video>
  );
}

/**
 * Locked to exactly one viewport tall (`h-screen`, not `min-h-screen`) so
 * the looping video is always fully visible without scrolling. Text now
 * sits on the left, vertically centered, matching the video's cluster
 * being pushed toward the right (see `HeroVideoBackground`) — a classic
 * split layout rather than the earlier bottom-pinned centered block.
 */
export function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-white">
      <HeroVideoBackground />

      <div className="container-content relative flex h-full items-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer(0.12)}
          className="max-w-[560px] text-left"
        >
          {/*
            Overrides the type-hero token at every breakpoint — the token's
            own sizes (40/52/64px) were too wide for the 560px column above,
            so lines kept wrapping into extra sub-lines instead of the
            intended layout. Now split across 3 short lines ("We build
            software" / "that moves your" / "business"), each comfortably
            fitting one line at these sizes — including 28px on mobile,
            where the longest line ("We build software") still clears a
            narrow phone width with room to spare.
          */}
          <motion.h1
            variants={fadeUp}
            className="type-hero !text-[1.75rem] text-ink-950 md:!text-[2.25rem] lg:!text-[3.125rem]"
          >
            We build software
            <br />
            that moves your
            <br />
            <span className="text-ink-950">business</span>
          </motion.h1>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticButton href="/contact">Start a Project</MagneticButton>
            <Link
              href="/portfolio"
              className="type-button btn-focus group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-ink-900 transition-colors hover:text-brand-600"
            >
              View our work
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
