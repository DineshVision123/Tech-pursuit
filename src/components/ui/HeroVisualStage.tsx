import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type HeroVisualStageProps = {
  readonly children: ReactNode;
  readonly className?: string;
};

/**
 * Unframed sizing shell for a hero's right-side visual — same footprint as
 * `HeroVisualPanel` (so the two-column grid/spacing is untouched) but with
 * no border, background, rounded corners, or shadow. Used by visuals that
 * should float directly over the hero's own ambient backdrop instead of
 * sitting inside a boxed card (Services, Work, Industries, Careers).
 */
export function HeroVisualStage({ children, className }: HeroVisualStageProps) {
  return (
    <div
      className={cn(
        'relative mx-auto aspect-[4/5] w-full max-w-[440px] lg:mx-0 lg:aspect-auto lg:h-[600px] lg:max-w-none',
        className,
      )}
    >
      {children}
    </div>
  );
}
