import Image from 'next/image';
import { industries } from '@/lib/data/industries';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Marquee } from '@/components/ui/Marquee';

/** Auto-scrolling single row of every industry — hover to pause, matches the Technologies marquee rhythm. */
export function IndustriesStrip() {
  return (
    <section className="relative overflow-hidden bg-white py-6 md:py-8 lg:py-10">
      <div className="container-content">
        <SectionHeading
          eyebrow="Industries"
          title="Domain context, not just code"
          description="We pair engineers with real familiarity in your industry's constraints — compliance, data sensitivity, and workflow quirks included."
        />
      </div>

      <div className="mt-14 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <Marquee durationSeconds={55}>
          {industries.map((industry) => (
            <div
              key={industry.slug}
              className="group w-[280px] shrink-0 overflow-hidden rounded-2xl border border-ink-900/[0.06] bg-surface-soft transition-all duration-300 hover:border-brand-300 hover:shadow-card"
            >
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                <Image
                  src={industry.image}
                  alt=""
                  fill
                  sizes="280px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-ink-950/5 to-transparent" />
                <industry.icon
                  size={22}
                  strokeWidth={1.8}
                  className="absolute bottom-3 left-4 text-white drop-shadow"
                />
              </div>
              {/* Fixed 280px scroller chip — deliberately smaller than the type-card
                  token, which would wrap 2–3 lines at this width and look broken. */}
              <div className="p-5">
                <h3 className="type-small font-semibold text-ink-900">{industry.name}</h3>
                <p className="type-small mt-1.5 text-ink-500">{industry.description}</p>
              </div>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
