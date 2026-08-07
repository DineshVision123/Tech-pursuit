import type { Metadata } from 'next';
import Image from 'next/image';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { ClosingCTA } from '@/components/ui/ClosingCTA';
import { industries } from '@/lib/data/industries';
import { EcosystemVisual } from '@/components/hero-visuals/EcosystemVisual';

export const metadata: Metadata = {
  title: 'Industries',
  description:
    'Domain-aware engineering across financial services, healthcare, retail, logistics, manufacturing, education, real estate, travel, energy, and the public sector.',
};

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Context matters as much as code"
        description="Every industry has its own compliance rules, data sensitivities, and workflow quirks. We build with those in mind from day one."
        visual={<EcosystemVisual />}
        visualFramed={false}
      />

      <section className="bg-white py-6 md:py-8 lg:py-10">
        <div className="container-content">
          <SectionHeading eyebrow="Where we work" title="Industries we serve" />

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry, i) => (
              <Reveal
                key={industry.slug}
                delay={(i % 3) * 0.06}
                className="group overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-surface-soft transition-all duration-300 hover:border-brand-300 hover:bg-white hover:shadow-card"
              >
                <div className="relative aspect-[3/2] w-full overflow-hidden">
                  <Image
                    src={industry.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-ink-950/5 to-transparent" />
                  <industry.icon
                    size={24}
                    strokeWidth={1.8}
                    className="absolute bottom-3 left-4 text-white drop-shadow"
                  />
                </div>
                <div className="p-7">
                  <h3 className="type-card text-ink-900">{industry.name}</h3>
                  <p className="type-small mt-2 text-ink-500">{industry.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ClosingCTA
        title={
          <>
            Don’t see your industry?
            <br />
            We probably still fit.
          </>
        }
      />
    </>
  );
}
