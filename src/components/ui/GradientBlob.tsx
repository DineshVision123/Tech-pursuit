import { cn } from '@/lib/cn';

type GradientBlobProps = {
  readonly className?: string;
  readonly tone?: 'brand' | 'gold';
};

/** Decorative ambient glow — used instead of stock photography for atmosphere. */
export function GradientBlob({ className, tone = 'brand' }: GradientBlobProps) {
  const tones = {
    brand: 'from-brand-500/40 via-brand-400/10 to-transparent',
    gold: 'from-gold-500/35 via-gold-400/10 to-transparent',
  } as const;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute rounded-full blur-3xl animate-float bg-gradient-to-br',
        tones[tone],
        className,
      )}
    />
  );
}
