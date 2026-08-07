'use client';

import { useMemo } from 'react';
import { CanvasScene } from './CanvasScene';
import {
  createCodeStreamScene,
  createNetworkGraphScene,
  createDashboardPulseScene,
  createHexGridScene,
  createOrbFieldScene,
  createAuroraWaveScene,
  createGlobeNetworkScene,
} from '@/lib/canvasScenes';

export type HeroVariant =
  | 'code' // Home — data/code in motion
  | 'network' // Services — architecture, integrations
  | 'dashboard' // Portfolio — product/dashboard mockups
  | 'hexgrid' // Industries — connected systems
  | 'orbs' // About — ideas, culture
  | 'aurora' // Careers — creative energy
  | 'globe'; // Contact — global connectivity

const SCENE_FACTORY: Record<HeroVariant, () => ReturnType<typeof createCodeStreamScene>> = {
  code: createCodeStreamScene,
  network: createNetworkGraphScene,
  dashboard: createDashboardPulseScene,
  hexgrid: createHexGridScene,
  orbs: createOrbFieldScene,
  aurora: createAuroraWaveScene,
  globe: createGlobeNetworkScene,
};

type HeroBackgroundProps = {
  readonly variant: HeroVariant;
  /**
   * Overlay darkness, 0–1. Defaults to a light 0.1 — just enough to keep
   * text readable without hiding the animation behind it. The scene itself
   * is the visual; it shouldn't get flattened by a heavy dark wash.
   */
  readonly overlay?: number;
};

/**
 * Full-bleed animated hero background: a procedural canvas scene (no image
 * or video assets — self-contained and unique per page), fading in on
 * mount. Kept at full opacity with only a light overlay so the animation
 * stays clearly visible on every page.
 */
export function HeroBackground({ variant, overlay = 0.1 }: HeroBackgroundProps) {
  // useMemo (not useState) is intentional: this only needs to survive
  // re-renders, not persist across a full unmount/remount — and unlike
  // useState(() => ...), it never risks re-invoking the initializer on the
  // client after an SSR pass with different props.
  const draw = useMemo(() => SCENE_FACTORY[variant](), [variant]);

  return (
    <div className="absolute inset-0 animate-hero-fade-in">
      <CanvasScene draw={draw} />
      {overlay > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(5,7,13,${overlay})` }}
        />
      )}
      <div className="noise-overlay" />
    </div>
  );
}
