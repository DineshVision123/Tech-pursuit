import { Space_Grotesk } from 'next/font/google';
import '../portal/portal.css';

// Same font as the portal itself (see src/app/portal/layout.tsx) — without
// it, `var(--portal-font-display)` (which references `var(--font-grotesk)`
// internally) would be invalid and headings could fall back to the browser
// default font entirely rather than gracefully degrading to Inter.
const grotesk = Space_Grotesk({
  variable: '--font-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * The public `/pay/[token]` page renders the same invoice-document markup
 * (`.card`, `.doc`, etc.) as the portal, so it needs the same stylesheet —
 * but none of the portal's chrome (`AppShell`/Sidebar/TopBar/auth). This
 * layout exists solely to load `portal.css` and apply the `.portal-app`
 * scoping class those rules are written against; Next.js dedupes the CSS
 * import, so it's not double-shipped when a visitor also has `/portal/**`
 * open in another tab.
 */
// Reads a live database row keyed by the URL's token — never prerendered.
export const dynamic = 'force-dynamic';

export default function PayLayout({ children }: { readonly children: React.ReactNode }) {
  return <div className={`portal-app ${grotesk.variable}`}>{children}</div>;
}
