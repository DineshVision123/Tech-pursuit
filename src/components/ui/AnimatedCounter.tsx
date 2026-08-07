'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

type AnimatedCounterProps = {
  readonly value: number;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly duration?: number;
  readonly className?: string;
};

/** Counts up to `value` once it scrolls into view. */
export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Vertical-only inset: a horizontal inset here penalizes whichever stat sits
  // closest to the left edge of the viewport, since its ref (just the number
  // span) can be narrower than the inset itself — that stat then never
  // intersects and stays stuck at 0 while its siblings animate normally.
  const isInView = useInView(ref, { once: true, margin: '-100px 0px' });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, motionValue, value]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.round(latest).toLocaleString()}${suffix}`;
      }
    });
    return unsubscribe;
  }, [spring, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
