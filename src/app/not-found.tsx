import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

/**
 * The global 404 — must live at the true app root (Next.js convention), so
 * it sits outside the `(site)` route group and doesn't automatically
 * inherit that group's Navbar/Footer. Renders them directly instead, so an
 * unmatched URL still reads as "part of the site" rather than bare content.
 */
export default function NotFound() {
  return (
    <>
      <Navbar />
      <section className="flex min-h-[70vh] flex-col items-center justify-center bg-ink-950 px-6 text-center text-white">
        <span className="eyebrow">404</span>
        <h1 className="type-section mt-4">Page not found</h1>
        <p className="type-body mt-3 text-ink-300">
          The page you’re looking for doesn’t exist or has moved.
        </p>
        <Link
          href="/"
          className="type-button btn-focus mt-8 inline-flex items-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-white shadow-glow"
        >
          Back to home
        </Link>
      </section>
      <Footer />
    </>
  );
}
