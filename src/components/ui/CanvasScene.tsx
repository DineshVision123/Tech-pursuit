'use client';

import { useEffect, useRef } from 'react';
import type { DrawFn } from '@/lib/canvasScenes';
import { cn } from '@/lib/cn';

type CanvasSceneProps = {
  readonly draw: DrawFn;
  readonly className?: string;
};

/**
 * Runs a stateful draw closure on a full-size canvas via requestAnimationFrame.
 * Pauses when the tab is hidden, renders a single static frame (no RAF loop)
 * when the user prefers reduced motion, and caps devicePixelRatio at 2 to
 * keep mobile GPUs happy.
 */
export function CanvasScene({ draw, className }: CanvasSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId = 0;
    const startTime = performance.now();

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = Math.max(1, Math.round(rect.width * dpr));
      canvas!.height = Math.max(1, Math.round(rect.height * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    function renderFrame(now: number) {
      const rect = canvas!.getBoundingClientRect();
      if (!document.hidden) {
        draw(ctx!, rect.width, rect.height, (now - startTime) / 1000);
      }
      rafId = requestAnimationFrame(renderFrame);
    }

    if (prefersReducedMotion) {
      const rect = canvas.getBoundingClientRect();
      draw(ctx, rect.width, rect.height, 0);
    } else {
      rafId = requestAnimationFrame(renderFrame);
    }

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
    // `draw` is a stable factory-created closure passed in by the caller —
    // re-running this effect on identity change is the intended behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw]);

  return <canvas ref={canvasRef} aria-hidden className={cn('block h-full w-full', className)} />;
}
