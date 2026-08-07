'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { projects } from '@/lib/data/projects';
import { cn } from '@/lib/cn';
import { fadeUp } from '@/lib/motion';

const filters = ['All', ...Array.from(new Set(projects.map((p) => p.industry)))];

export function ProjectGallery() {
  const [filter, setFilter] = useState('All');

  const visible = useMemo(
    () => (filter === 'All' ? projects : projects.filter((p) => p.industry === filter)),
    [filter],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'type-badge btn-focus rounded-full px-4 py-2 transition-colors',
              filter === f
                ? 'bg-ink-900 text-white'
                : 'bg-surface-soft text-ink-600 hover:bg-ink-100',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <motion.div
        layout
        className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {visible.map((project) => (
            <motion.div
              key={project.slug}
              layout
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0.96 }}
              variants={fadeUp}
              className="group card-elevated flex flex-col justify-between p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="type-badge rounded-full bg-ink-50 px-3 py-1 text-ink-500">
                    {project.industry}
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="text-ink-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-500"
                  />
                </div>
                <h3 className="type-card mt-6 text-ink-900">{project.name}</h3>
                <p className="type-small mt-2 text-ink-500">{project.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span key={tag} className="type-badge rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-7 space-y-3 border-t border-ink-900/[0.06] pt-5">
                <div>
                  <p className="type-card text-brand-600">{project.metric.value}</p>
                  <p className="type-badge text-ink-400">{project.metric.label}</p>
                </div>
                <p className="type-small text-ink-500">{project.outcome}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
