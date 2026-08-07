'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { projects } from '@/lib/data/projects';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { MagneticButton } from '@/components/ui/MagneticButton';

/** Horizontal-scroll project rail — visually distinct from the grid sections above. */
export function CaseStudies() {
  const featured = projects.slice(0, 4);

  return (
    <section className="relative bg-ink-950 py-6 text-white md:py-8 lg:py-10">
      <div className="absolute inset-0 bg-gold-radial opacity-40" />
      <div className="container-content relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Selected Work"
            title="Case studies from recent engagements"
            light
          />
          <MagneticButton href="/portfolio" variant="ghost">
            View all work
          </MagneticButton>
        </div>
      </div>

      <div className="mt-14 overflow-x-auto pb-4">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="container-content flex gap-5"
          style={{ width: 'max-content' }}
        >
          {featured.map((project) => (
            <motion.div key={project.slug} variants={fadeUp}>
              <Link
                href="/portfolio"
                className="group glass flex h-full w-[320px] flex-col rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 sm:w-[380px]"
              >
                <div className="flex items-center justify-between">
                  <span className="type-badge rounded-full bg-white/5 px-3 py-1 text-ink-200">
                    {project.industry}
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="text-ink-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                  />
                </div>
                <h3 className="type-card mt-6 text-white">{project.name}</h3>
                <p className="type-small mt-3 text-ink-300">{project.summary}</p>
                {/* mt-auto, not mt-8 — pins the metric block to the bottom
                    of the card regardless of how long the description/
                    summary above it runs, so every card in the row lines
                    up at the same height instead of the shortest-content
                    card looking visibly smaller than its siblings. */}
                <div className="mt-auto space-y-3 border-t border-white/10 pt-5">
                  <div>
                    <p className="type-card text-gradient-gold">{project.metric.value}</p>
                    <p className="type-badge text-ink-400">{project.metric.label}</p>
                  </div>
                  <p className="type-small text-ink-300">{project.outcome}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
