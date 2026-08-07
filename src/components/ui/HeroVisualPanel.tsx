import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type HeroVisualPanelProps = {
  readonly children: ReactNode;
  readonly className?: string;
};

/**
 * Bounded, framed container for a hero's right-side visual. Shared across
 * the homepage and every inner page so all seven page-specific visuals
 * (video, SVG diagrams, canvas globe, CSS mockups...) sit inside one
 * consistent premium "card" treatment rather than each inventing its own
 * frame — rounded corners, a soft border/glow, and a matching aspect ratio
 * on mobile/tablet before the two-column grid takes over at `lg`.
 */
export function HeroVisualPanel({ children, className }: HeroVisualPanelProps) {
  return (
    <div
      className={cn(
        'relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden rounded-[28px] border border-white/10 shadow-glow lg:mx-0 lg:aspect-auto lg:h-[600px] lg:max-w-none',
        className,
      )}
    >
      {children}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/[0.07]" />
    </div>
  );
}
