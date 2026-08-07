'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { services } from '@/lib/data/services';
import { cn } from '@/lib/cn';
import { fadeUp } from '@/lib/motion';

/** Click a service to see its detail panel update — the "interactive service grid + details" combo. */
export function ServiceExplorer() {
  const [activeSlug, setActiveSlug] = useState(services[0]?.slug ?? '');
  const active = services.find((s) => s.slug === activeSlug) ?? services[0]!;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
        {services.map((service) => {
          const isActive = service.slug === activeSlug;
          return (
            <button
              key={service.slug}
              id={service.slug}
              type="button"
              onClick={() => setActiveSlug(service.slug)}
              className={cn(
                'btn-focus group flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-300',
                isActive
                  ? 'border-brand-400 bg-white shadow-glow'
                  : 'border-ink-900/[0.06] bg-surface-soft hover:border-ink-900/15',
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white'
                    : 'bg-white text-ink-500 group-hover:text-brand-600',
                )}
              >
                <service.icon size={18} strokeWidth={1.8} />
              </div>
              <span className={cn('type-badge', isActive ? 'text-ink-900' : 'text-ink-600')}>
                {service.title}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.slug}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -12 }}
          variants={fadeUp}
          className="card-elevated overflow-hidden"
        >
          <div className="relative aspect-[3/2] w-full">
            <Image
              src={active.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
          </div>

          <div className="p-8 pt-0 lg:p-10 lg:pt-0">
            <span className="type-badge text-brand-600">{active.tagline}</span>
            <h3 className="type-card mt-2 text-ink-900">{active.title}</h3>
            <p className="type-body mt-4 text-ink-500">{active.description}</p>

            <ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {active.capabilities.map((cap) => (
                <li key={cap} className="type-small flex items-center gap-2.5 text-ink-700">
                  <CheckCircle2 size={16} className="shrink-0 text-brand-500" />
                  {cap}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-2 border-t border-ink-900/[0.06] pt-6">
              {active.technologies.map((tech) => (
                <span key={tech} className="type-badge rounded-full bg-ink-50 px-3 py-1.5 text-ink-600">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
