import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './portal.css';
import { AppShell } from '@/components/portal/AppShell';
import { Providers } from '@/components/portal/Providers';

// The portal's own display font, layered on top of the shared `--font-inter`
// the root layout already provides (see src/app/layout.tsx) — no need to
// load Inter a second time, just the one thing this subtree needs that the
// marketing site doesn't.
const grotesk = Space_Grotesk({
  variable: '--font-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Invoice Portal · Tech Pursuit Systems',
    template: '%s · Tech Pursuit Invoices',
  },
  description: 'Create, approve, and track invoices end-to-end — Tech Pursuit Systems.',
  robots: { index: false, follow: false },
};

// Every /portal/** page reads per-request auth state and live database
// data — never a candidate for static prerendering (that would mean baking
// one visitor's dashboard into a cached page served to everyone, and would
// also make `next build` try to hit Postgres before DATABASE_URL is
// necessarily configured). Setting this on the layout cascades to every
// nested page automatically.
export const dynamic = 'force-dynamic';

/**
 * Chrome for the whole invoice portal (`/portal/**`) — a completely
 * separate visual system from the marketing site's `(site)/layout.tsx`
 * (own fonts, own Sidebar/TopBar via `AppShell`, own `.vs-*`-prefixed CSS in
 * `./portal.css`, route-scoped so it never loads on marketing pages). No
 * Navbar/Footer/smooth-scroll here — see `src/app/layout.tsx` for why those
 * live one level up instead.
 */
export default function PortalLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className={`portal-app ${grotesk.variable}`}>
      <Providers>
        <AppShell>{children}</AppShell>
      </Providers>
    </div>
  );
}
