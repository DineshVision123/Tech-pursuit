import type { Testimonial } from '@/types';

/**
 * PLACEHOLDER TESTIMONIALS — structured examples only, no real people or
 * companies. Swap for real, permissioned quotes before public launch.
 */
export const testimonials: readonly Testimonial[] = [
  {
    quote:
      'They didn’t just build what we asked for — they pushed back on the parts that wouldn’t scale and were right every time.',
    name: 'VP of Engineering',
    role: 'VP of Engineering',
    company: 'Placeholder — SaaS scale-up',
    placeholder: true,
  },
  {
    quote:
      'Our release cadence went from monthly to weekly within a quarter, without sacrificing stability.',
    name: 'Director of Product',
    role: 'Director of Product',
    company: 'Placeholder — Fintech',
    placeholder: true,
  },
  {
    quote:
      'The team embedded like they were ours from day one. Communication was never the bottleneck.',
    name: 'Head of Operations',
    role: 'Head of Operations',
    company: 'Placeholder — Logistics',
    placeholder: true,
  },
  {
    quote:
      'We came for staffing help and stayed for the platform rebuild. That flexibility mattered a lot to us.',
    name: 'CTO',
    role: 'CTO',
    company: 'Placeholder — Retail',
    placeholder: true,
  },
] as const;
