import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SmoothScrollProvider } from '@/components/layout/SmoothScrollProvider';

/**
 * Chrome for every marketing page (home, about, services, portfolio,
 * industries, contact, careers) — Navbar, Footer, and the Lenis smooth-scroll
 * provider. Split out of the root layout so `/portal/**` (the invoice app)
 * and the public `/pay/[token]` page render with neither this chrome nor
 * their own colliding with it — see `src/app/portal/layout.tsx`.
 *
 * A route *group* (parens in the folder name) — doesn't add a URL segment,
 * so `/about` is still `/about`, not `/(site)/about`.
 */
export default function SiteLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <SmoothScrollProvider>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </SmoothScrollProvider>
  );
}
