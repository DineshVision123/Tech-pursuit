'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { services } from '@/lib/data/services';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

/**
 * Interactive service grid — a curated 6 on the homepage (excluding Talent
 * Solutions, which gets its own small section), with the rest surfaced via
 * the "Explore all services" CTA to the full interactive explorer on
 * /services rather than crowding this page.
 */
export function ServicesGrid() {
  const featured = services.filter((s) => s.slug !== 'talent-solutions').slice(0, 6);

  return (
    <section className="relative bg-surface-soft py-6 md:py-8 lg:py-10">
      <div className="container-content">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="What we do"
            title="IT services built for outcomes, not hours"
            description="Every engagement starts with the same question: what does success look like in six months? Then we engineer backwards from there."
          />
          <MagneticButton href="/services" variant="light" className="hidden sm:inline-flex">
            Explore all services
          </MagneticButton>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerContainer(0.06)}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {featured.map((service) => (
            <motion.div key={service.slug} variants={fadeUp} className="group">
              <Link
                href={`/services#${service.slug}`}
                className="card-elevated flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow"
              >
                <div className="relative aspect-[3/2] w-full overflow-hidden">
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow">
                    <service.icon size={20} strokeWidth={1.8} />
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="absolute right-4 top-3 text-white/80 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="type-card text-ink-900">{service.title}</h3>
                    <p className="type-small mt-1 text-brand-600">{service.tagline}</p>
                    <p className="type-small mt-3 text-ink-500">{service.description}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {service.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="type-badge rounded-full bg-ink-50 px-2.5 py-1 text-ink-500"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-10 flex justify-center sm:hidden">
          <MagneticButton href="/services" variant="light">
            Explore all services
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
