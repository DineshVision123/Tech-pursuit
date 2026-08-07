import Link from 'next/link';
import { Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Reveal } from '@/components/ui/Reveal';

const points = ['IT Staffing', 'Contract Staffing', 'Dedicated Teams', 'Resource Augmentation'];

/**
 * Deliberately small, low-key section — one compact banner, not a grid — so
 * recruitment reads as a supporting capability rather than the main event.
 */
export function TalentSolutions() {
  return (
    <section className="relative bg-surface-soft py-6 md:py-8 lg:py-10">
      <div className="container-content">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-ink-900/[0.06] bg-white p-8 shadow-card sm:flex-row sm:items-center lg:p-10">
            <div className="flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-white">
                <Users size={20} strokeWidth={1.8} />
              </div>
              <div>
                <span className="eyebrow text-ink-400">Talent Solutions</span>
                <h3 className="type-card mt-2 max-w-md text-ink-900">
                  Need engineers, not a rebuild? We staff for that too.
                </h3>
                <ul className="type-small mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-ink-500">
                  {points.map((point) => (
                    <li key={point} className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-brand-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Link
              href="/services#talent-solutions"
              className="type-button btn-focus group inline-flex shrink-0 items-center gap-2 rounded-full border border-ink-900/10 px-5 py-2.5 text-ink-900 transition-colors hover:border-ink-900/25"
            >
              Explore staffing
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
