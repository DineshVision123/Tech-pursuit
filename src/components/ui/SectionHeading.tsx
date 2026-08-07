import type { ReactNode } from 'react';
import { Reveal } from './Reveal';
import { cn } from '@/lib/cn';

type SectionHeadingProps = {
  readonly eyebrow: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly align?: 'left' | 'center';
  readonly light?: boolean;
  readonly className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  light = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        // Wide enough that most short section titles clear one line at the
        // lg font size instead of wrapping into a lone trailing word/phrase;
        // the description paragraph still gets its own narrower cap via
        // type-body, so it doesn't stretch just because this box got wider.
        'max-w-[960px]',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      <Reveal>
        <span className="eyebrow">{eyebrow}</span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className={cn('type-section mt-4', light ? 'text-white' : 'text-ink-900')}>
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.16}>
          {/* type-body's own max-w-[680px] is narrower than this heading's
              960px box — without mx-auto here, the paragraph sits flush
              against the left edge of that wider box (text-center only
              centers text *within* the paragraph's own box, not the box
              itself), so on centered headings it visibly drifted off-center
              once it wrapped to a second line. */}
          <p
            className={cn(
              'type-body mt-6',
              align === 'center' && 'mx-auto',
              light ? 'text-ink-200' : 'text-ink-500',
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
