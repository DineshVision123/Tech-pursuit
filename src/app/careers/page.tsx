import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Rocket, Heart, GraduationCap, Home } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { ClosingCTA } from '@/components/ui/ClosingCTA';
import { jobs } from '@/lib/data/jobs';
import { CultureVisual } from '@/components/hero-visuals/CultureVisual';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join Tech Pursuit Systems — build premium software with a senior, remote-first team.',
};

const perks = [
  { icon: Home, title: 'Remote-first', body: 'Work from anywhere — we hire on output, not location.' },
  { icon: Rocket, title: 'Real ownership', body: 'You’ll ship features clients actually use, fast.' },
  { icon: GraduationCap, title: 'Growth budget', body: 'Courses, conferences, and certifications, covered.' },
  { icon: Heart, title: 'Senior peers', body: 'Learn by working alongside people who’ve done this before.' },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Build with people who care about the craft"
        description="We’re a small, senior, remote-first team. If that sounds like your kind of place, take a look below."
        visual={<CultureVisual />}
        visualFramed={false}
        backgroundVideo={{
          mp4: '/videos/careers-bg.mp4',
          webm: '/videos/careers-bg.webm',
          poster: '/videos/careers-bg-poster.jpg',
        }}
      />

      {/* Why Join Us */}
      <section className="bg-white py-6 md:py-8 lg:py-10">
        <div className="container-content">
          <SectionHeading eyebrow="Why Join Us" title="What it’s actually like here" />
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((perk) => (
              <Reveal key={perk.title} className="card-elevated p-6">
                <perk.icon size={24} className="text-brand-600" strokeWidth={1.6} />
                <h3 className="type-card mt-5 text-ink-900">{perk.title}</h3>
                <p className="type-small mt-2 text-ink-500">{perk.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="bg-surface-soft py-6 md:py-8 lg:py-10">
        <div className="container-content">
          <SectionHeading eyebrow="Open Positions" title="Current openings" />
          <div className="mt-12 divide-y divide-ink-900/[0.06] rounded-3xl border border-ink-900/[0.06] bg-white shadow-card">
            {jobs.map((job) => (
              <Reveal key={job.slug}>
                <Link
                  href={`/contact?role=${encodeURIComponent(job.title)}`}
                  className="group flex flex-col items-start justify-between gap-3 p-6 transition-colors hover:bg-surface-soft sm:flex-row sm:items-center lg:p-7"
                >
                  <div>
                    <h3 className="type-card text-ink-900">{job.title}</h3>
                    <p className="type-small mt-1 text-ink-500">
                      {job.department} · {job.location} · {job.type}
                    </p>
                  </div>
                  <span className="type-button btn-focus inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 px-4 py-2 text-ink-900 transition-colors group-hover:border-ink-900/25">
                    Apply
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
          <p className="type-small mt-6 text-ink-400">
            Sample openings — connect the careers page to your ATS to replace this list.
          </p>
        </div>
      </section>

      <ClosingCTA
        eyebrow="Apply"
        title={
          <>
            Don’t see the right role?
            <br />
            Introduce yourself anyway.
          </>
        }
        buttonLabel="Get in Touch"
      />
    </>
  );
}
