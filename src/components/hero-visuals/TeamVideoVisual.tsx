'use client';

import { motion } from 'framer-motion';

/**
 * HOME — cinematic looping footage of a real product engineering team
 * gathered around a large display reviewing code. Above the fold, so this
 * loads eagerly (no IntersectionObserver gate like the closing CTA's video)
 * with a poster frame for an instant first paint.
 */
export function TeamVideoVisual() {
  return (
    <div className="relative h-full w-full bg-ink-950">
      <video
        className="h-full w-full object-cover"
        poster="/videos/home-hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/videos/home-hero.webm" type="video/webm" />
        <source src="/videos/home-hero.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/65 via-transparent to-ink-950/10" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass type-badge absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-white"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
        </span>
        Engineering in motion
      </motion.div>
    </div>
  );
}
