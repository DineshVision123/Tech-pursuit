'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/cn';

type RevealProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly delay?: number;
  readonly as?: 'div' | 'span';
  /**
   * Content that's already guaranteed to be in the initial viewport (e.g. a
   * page hero) should animate on mount, not wait on an IntersectionObserver
   * — with client-side navigation the new page can render, and get looked
   * at, before a scroll-linked reveal finishes its transition, reading as
   * "half rendered". Scroll-triggered reveal stays the default for content
   * further down the page.
   */
  readonly immediate?: boolean;
};

/** Fade-up reveal — scroll-triggered by default, or on-mount via `immediate`. */
export function Reveal({ children, className, delay = 0, as = 'div', immediate = false }: RevealProps) {
  const Component = motion[as];
  const viewportProps = immediate
    ? { animate: 'show' }
    : { whileInView: 'show', viewport: viewportOnce };
  return (
    <Component
      initial="hidden"
      {...viewportProps}
      variants={fadeUp}
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
