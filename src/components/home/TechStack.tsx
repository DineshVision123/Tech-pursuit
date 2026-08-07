import { technologies } from '@/lib/data/technologies';
import { Marquee } from '@/components/ui/Marquee';
import { SectionHeading } from '@/components/ui/SectionHeading';

/** Dual-row marquee ticker — the "Technologies" section. */
export function TechStack() {
  const first = technologies.slice(0, 8);
  const second = technologies.slice(8);

  return (
    <section className="relative overflow-hidden bg-surface-muted py-6 md:py-8 lg:py-10">
      <div className="container-content">
        <SectionHeading
          eyebrow="Technologies"
          title="A modern stack, chosen deliberately"
          align="center"
          className="mx-auto"
        />
      </div>

      <div className="mt-14 space-y-5 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <Marquee>
          {first.map((tech) => (
            <span
              key={tech.name}
              className="type-badge card-elevated flex items-center gap-2 rounded-full px-5 py-2.5 text-ink-700"
            >
              {tech.name}
            </span>
          ))}
        </Marquee>
        <Marquee reverse>
          {second.map((tech) => (
            <span
              key={tech.name}
              className="type-badge card-elevated flex items-center gap-2 rounded-full px-5 py-2.5 text-ink-700"
            >
              {tech.name}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
