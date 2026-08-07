'use client';

import { useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { ArrowUpRight } from 'lucide-react';

type MagneticButtonProps = {
  readonly href: string;
  readonly children: ReactNode;
  readonly variant?: 'primary' | 'ghost' | 'light';
  readonly className?: string;
  readonly showArrow?: boolean;
  readonly external?: boolean;
};

/**
 * A button that gently follows the cursor within its bounds, and springs
 * back on leave. A signature "premium" micro-interaction.
 */
export function MagneticButton({
  href,
  children,
  variant = 'primary',
  className,
  showArrow = true,
  external = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    setPos({ x: relX * 0.3, y: relY * 0.4 });
  }

  function handleMouseLeave() {
    setPos({ x: 0, y: 0 });
  }

  const styles = {
    primary:
      'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow hover:shadow-glow',
    ghost: 'border border-white/15 text-white hover:bg-white/5',
    light: 'border border-ink-900/10 bg-white text-ink-900 shadow-card hover:border-ink-900/20',
  } as const;

  const Comp = motion(Link);

  return (
    <Comp
      ref={ref}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 12, mass: 0.4 }}
      className={cn(
        'type-button btn-focus group inline-flex items-center gap-2 rounded-full px-6 py-3.5 transition-colors duration-300',
        styles[variant],
        className,
      )}
    >
      <span>{children}</span>
      {showArrow && (
        <ArrowUpRight
          size={16}
          className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </Comp>
  );
}
