import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// One font family for the entire site, per the typography system — no
// mixing. All weights the type scale needs (400–800) come from this single
// Inter instance.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://techpursuitsystems.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Tech Pursuit Systems — IT Services & Digital Transformation',
    template: '%s · Tech Pursuit Systems',
  },
  description:
    'Tech Pursuit Systems builds premium software products, cloud platforms, and applied AI — with IT talent solutions as a supporting capability.',
  keywords: [
    'IT services',
    'digital transformation',
    'software development company',
    'cloud engineering',
    'IT staffing',
    'product engineering',
  ],
  openGraph: {
    title: 'Tech Pursuit Systems',
    description:
      'IT Services & Digital Transformation — premium software products, cloud platforms, and applied AI.',
    url: siteUrl,
    siteName: 'Tech Pursuit Systems',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech Pursuit Systems',
    description: 'IT Services & Digital Transformation partner.',
  },
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

/**
 * Truly global shell only — html/body, the one Inter font instance, and
 * site-wide metadata. No Navbar/Footer/smooth-scroll here: those are
 * marketing-only chrome that now lives in `(site)/layout.tsx`, so that
 * `/portal/**` (its own Sidebar/TopBar chrome) and the public
 * `/pay/[token]` page (no chrome at all) don't inherit them.
 */
export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-ink-950 font-body text-ink-900 antialiased">{children}</body>
    </html>
  );
}
