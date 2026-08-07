/**
 * Shared, static ambient background for every hero section (homepage +
 * all inner pages via PageHero). Deliberately NOT a canvas/RAF animation —
 * each hero's right-side visual is now the animated focal point, so the
 * section backdrop behind the text column stays a lightweight CSS wash
 * (brand glow + faint grid + noise) instead of competing for attention or
 * GPU budget with a second running animation.
 */
export function HeroAmbientBackdrop() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-grid-glow" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div className="noise-overlay" />
    </div>
  );
}
