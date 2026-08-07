import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type MarqueeProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly reverse?: boolean;
  /** Seconds for one full pass — lower is faster. Defaults to the 32s set in tailwind.config. */
  readonly durationSeconds?: number;
};

/** Infinite horizontal scroller — duplicate the children once via CSS animation. */
export function Marquee({ children, className, reverse = false, durationSeconds }: MarqueeProps) {
  const style = durationSeconds ? { animationDuration: `${durationSeconds}s` } : undefined;
  return (
    <div className={cn('group relative flex overflow-hidden', className)}>
      <div
        style={style}
        className={cn(
          'flex shrink-0 items-center gap-10 pr-10 animate-marquee group-hover:[animation-play-state:paused]',
          reverse && '[animation-direction:reverse]',
        )}
      >
        {children}
      </div>
      <div
        aria-hidden
        style={style}
        className={cn(
          'flex shrink-0 items-center gap-10 pr-10 animate-marquee group-hover:[animation-play-state:paused]',
          reverse && '[animation-direction:reverse]',
        )}
      >
        {children}
      </div>
    </div>
  );
}
