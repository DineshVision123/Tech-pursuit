import type { ReactNode } from 'react';
import { MagneticButton } from './MagneticButton';
import { VideoBackground } from './VideoBackground';
import { Reveal } from './Reveal';

type ClosingCTAProps = {
  readonly eyebrow?: string;
  readonly title: ReactNode;
  readonly buttonLabel?: string;
  readonly href?: string;
};

/**
 * Reusable full-bleed closing CTA — used at the end of every page.
 *
 * Background is a looping abstract video (bright, cool silver/blue metallic
 * shapes) rather than the flat gradient used elsewhere, so text treatment
 * is tuned for it specifically: a strong dark wash + center vignette for
 * contrast against the bright highlights, a gold eyebrow (warmer than the
 * site's usual blue, reads clearly against the cool footage) and a subtle
 * drop-shadow on the heading so it stays legible while the shapes move.
 */
export function ClosingCTA({
  eyebrow = 'Let’s talk',
  title,
  buttonLabel = 'Start a Project',
  href = '/contact',
}: ClosingCTAProps) {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-6 text-center text-white md:py-8 lg:py-10">
      <VideoBackground
        webm="/videos/cta-background.webm"
        mp4="/videos/cta-background.mp4"
        poster="/videos/cta-background-poster.jpg"
      />
      <div className="container-content relative">
        <Reveal>
          <span className="eyebrow text-gold-400">{eyebrow}</span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2
            className="type-section mx-auto mt-4 max-w-2xl [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]"
          >
            {title}
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="mt-9 flex justify-center">
            <MagneticButton href={href}>{buttonLabel}</MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
