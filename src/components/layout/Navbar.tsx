'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { primaryNav } from '@/lib/data/nav';
import { cn } from '@/lib/cn';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';
  // Background: transparent, floating over the hero at the very top; solid
  // white once scrolled past it (or while the mobile menu is open).
  const whiteBg = scrolled || open;
  // Text color: normally tracks the same transparent/white split as the
  // background — light text reads fine over every other page's dark
  // ink-950 hero wash. The homepage hero is the one exception: it's a
  // bright video, not that dark wash, so light text would disappear into
  // it even while the bar itself stays transparent — keep text dark there
  // from scrollY 0.
  const darkText = whiteBg || isHome;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        whiteBg ? 'py-3' : 'py-2',
      )}
    >
      <div
        className={cn(
          'container-content flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 sm:px-5',
          whiteBg ? 'bg-white shadow-lg' : 'bg-transparent',
        )}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.jpg"
            alt="Tech Pursuit Systems"
            width={36}
            height={36}
            className="rounded-lg"
            priority
          />
          <span
            className={cn(
              'font-display text-[15px] font-semibold leading-tight transition-colors',
              darkText ? 'text-ink-900' : 'text-white',
            )}
          >
            Tech Pursuit
            <span className={cn('block text-[10px] font-medium', darkText ? 'text-ink-500' : 'text-ink-300')}>
              SYSTEMS
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {primaryNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'type-nav transition-colors',
                darkText ? 'text-ink-600 hover:text-ink-900' : 'text-ink-200 hover:text-white',
                pathname === link.href && (darkText ? 'text-ink-900' : 'text-white'),
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/contact"
            className="type-button btn-focus inline-flex items-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-white shadow-glow transition-transform hover:scale-[1.03]"
          >
            Start a Project
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn('btn-focus rounded-full p-2 transition-colors lg:hidden', darkText ? 'text-ink-900' : 'text-white')}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="container-content mt-2 lg:hidden"
          >
            <div className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-lg">
              {primaryNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'type-nav rounded-xl px-3 py-2.5 text-ink-600 transition-colors hover:bg-surface-soft hover:text-ink-900',
                    pathname === link.href && 'text-ink-900',
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="type-button mt-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-2.5 text-center text-white"
              >
                Start a Project
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
