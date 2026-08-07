'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { testimonials } from '@/lib/data/testimonials';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

/** Offset column layout (2/2 split, second column shifted down) — distinct rhythm. */
export function Testimonials() {
  const [colA, colB] = [
    testimonials.filter((_, i) => i % 2 === 0),
    testimonials.filter((_, i) => i % 2 === 1),
  ];

  return (
    <section className="relative bg-ink-950 py-6 text-white md:py-8 lg:py-10">
      <div className="container-content">
        <SectionHeading eyebrow="Client Voices" title="What it’s like to work with us" light />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerContainer(0.1)}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2"
        >
          <div className="space-y-5">
            {colA.map((t) => (
              <TestimonialCard key={t.name + t.company} testimonial={t} />
            ))}
          </div>
          <div className="space-y-5 sm:mt-10">
            {colB.map((t) => (
              <TestimonialCard key={t.name + t.company} testimonial={t} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
}: {
  readonly testimonial: (typeof testimonials)[number];
}) {
  return (
    <motion.figure variants={fadeUp} className="glass rounded-2xl p-7">
      <Quote size={20} className="text-gold-400" />
      <blockquote className="type-small mt-4 text-ink-100">“{testimonial.quote}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <div className="type-badge flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-gold-400 text-white">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <p className="type-small font-semibold text-white">{testimonial.role}</p>
          <p className="type-badge text-ink-400">{testimonial.company}</p>
        </div>
      </figcaption>
    </motion.figure>
  );
}
