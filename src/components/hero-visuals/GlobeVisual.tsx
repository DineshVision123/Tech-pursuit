'use client';

import { useMemo } from 'react';
import { CanvasScene } from '@/components/ui/CanvasScene';
import { createGlobeNetworkScene } from '@/lib/canvasScenes';

/**
 * CONTACT — the existing wireframe-globe scene, now living inside the
 * bounded hero visual panel instead of full-bleed behind the text. See
 * `createGlobeNetworkScene` in `canvasScenes.ts` for the rotation/arc/
 * lighting improvements.
 */
export function GlobeVisual() {
  const draw = useMemo(() => createGlobeNetworkScene(), []);

  return (
    <div className="relative h-full w-full bg-ink-950">
      <div className="absolute inset-0 bg-grid-glow opacity-40" />
      <CanvasScene draw={draw} />
    </div>
  );
}
