import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Linkedin, Mail, MapPin } from 'lucide-react';
import { footerNav } from '@/lib/data/nav';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="section-dark border-t border-white/5">
      <div className="container-content py-10 lg:py-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.jpg"
                alt="Tech Pursuit Systems"
                width={38}
                height={38}
                className="rounded-lg"
              />
              <span className="font-display text-base font-semibold text-white">
                Tech Pursuit Systems
              </span>
            </Link>
            <p className="type-small mt-5 max-w-sm text-ink-300">
              An IT services & digital transformation partner — engineering premium
              software products, with talent solutions as a supporting capability.
            </p>
            <div className="mt-5 flex items-center gap-2 text-ink-300">
              <Mail size={15} className="text-brand-400" />
              <a
                href="mailto:hr@techpursuitsystems.com"
                className="type-small transition-colors hover:text-white"
              >
                hr@techpursuitsystems.com
              </a>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-ink-300">
              <MapPin size={15} className="text-brand-400" />
              <span className="type-small">Atlanta, Georgia</span>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                aria-label="LinkedIn"
                className="btn-focus flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink-200 transition-colors hover:border-white/30 hover:text-white"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {footerNav.map((group) => (
            <div key={group.title}>
              <h3 className="type-footer-heading text-white">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="type-footer-link text-ink-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-white/5 pt-6 sm:flex-row sm:items-center">
          <p className="type-small text-ink-400">© {year} Tech Pursuit Systems. All rights reserved.</p>
          <Link
            href="/contact"
            className="type-footer-link group inline-flex items-center gap-1.5 text-white"
          >
            Let’s build something
            <ArrowUpRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
