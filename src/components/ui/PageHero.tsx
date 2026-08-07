import type { ReactNode } from 'react';
import { HeroAmbientBackdrop } from './HeroAmbientBackdrop';
import { HeroVisualPanel } from './HeroVisualPanel';
import { HeroVisualStage } from './HeroVisualStage';

type PageHeroProps = {
  readonly eyebrow: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly visual: ReactNode;
  /**
   * Whether the visual sits inside the bordered/glowing `HeroVisualPanel`
   * card (default, used by About/Contact) or floats unframed via
   * `HeroVisualStage` — same footprint, no box (Services/Work/Industries/
   * Careers: those visuals are designed to read as floating directly over
   * the hero backdrop, not inside a container).
   */
  readonly visualFramed?: boolean;
  /**
   * Optional full-bleed video behind the *entire* section (both the text
   * column and the visual column) instead of the default static
   * `HeroAmbientBackdrop`. Careers-only today. No overlay/gradient is
   * layered on top of it by design — the video's own color carries the
   * section.
   */
  readonly backgroundVideo?: { readonly mp4: string; readonly webm: string; readonly poster: string };
};

/**
 * Dark hero used at the top of every inner page. Fills the viewport (like
 * the homepage hero does) so every page reads as a complete, deliberate
 * screen on arrival instead of a short banner dropping into a blank gap
 * before the next section's content appears.
 *
 * Two-column on `lg`: the text block (unchanged from before — same
 * eyebrow/h1/description, still static/non-animated, see note below) sits
 * left, and a page-specific `visual` (a video, diagram, mockup set, globe,
 * etc. — one distinct component per page, see `components/hero-visuals/`)
 * sits framed on the right via `HeroVisualPanel`. Below `lg` it stacks:
 * text first, then the visual at a bounded aspect ratio.
 *
 * The section background is a static CSS ambient wash (`HeroAmbientBackdrop`)
 * rather than a full-bleed animated canvas — the per-page visual is now the
 * one animated focal point, so it doesn't have to compete with a second
 * running animation behind the text.
 *
 * The heading/copy block is deliberately NOT animated — it's the first
 * thing rendered on a client-side route change, and any opacity/entrance
 * transition here has a real chance of being seen mid-fade (URL changes
 * instantly, content used to lag behind it), which reads as a
 * broken/half-loaded page rather than a polish. Static and immediate beats
 * a flourish here.
 */
export function PageHero({ eyebrow, title, description, visual, visualFramed = true, backgroundVideo }: PageHeroProps) {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-ink-950 text-white">
      {backgroundVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          poster={backgroundVideo.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={backgroundVideo.webm} type="video/webm" />
          <source src={backgroundVideo.mp4} type="video/mp4" />
        </video>
      ) : (
        <HeroAmbientBackdrop />
      )}

      <div className="container-content relative flex flex-1 items-center pt-28 sm:pt-24">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_460px] lg:gap-16">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            {/* type-section, not type-hero — the Display Hero scale is
                reserved for the homepage hero only; every inner page's <h1>
                uses the Section Heading scale instead. */}
            <h1 className="type-section mt-6 max-w-[640px]">{title}</h1>
            {description && <p className="type-body mt-6 text-ink-200">{description}</p>}
          </div>
          {visualFramed ? <HeroVisualPanel>{visual}</HeroVisualPanel> : <HeroVisualStage>{visual}</HeroVisualStage>}
        </div>
      </div>
    </section>
  );
}
