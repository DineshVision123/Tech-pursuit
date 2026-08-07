'use client';

import { useEffect, useRef, useState } from 'react';

type VideoBackgroundProps = {
  readonly webm: string;
  readonly mp4: string;
  readonly poster: string;
  /** Overlay darkness, 0–1. Defaults to 0.62 — this source clip runs bright/silver, so it needs a strong wash for text contrast. */
  readonly overlay?: number;
};

/**
 * Full-bleed looping background video. Doesn't start loading/playing until
 * the section is about to scroll into view (this sits near the bottom of
 * every page, so there's no reason to fetch it on initial page load).
 */
export function VideoBackground({ webm, mp4, poster, overlay = 0.62 }: VideoBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 animate-hero-fade-in">
      {shouldLoad && (
        <video
          className="h-full w-full object-cover"
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
        >
          <source src={webm} type="video/webm" />
          <source src={mp4} type="video/mp4" />
        </video>
      )}
      {!shouldLoad && (
        // eslint-disable-next-line @next/next/no-img-element -- tiny static poster, not worth next/image here
        <img src={poster} alt="" className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(5,7,13,${overlay})` }} />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 50%, transparent 30%, rgba(5,7,13,0.35) 100%)',
        }}
      />
      <div className="noise-overlay" />
    </div>
  );
}
