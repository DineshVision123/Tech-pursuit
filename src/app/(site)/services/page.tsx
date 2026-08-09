import type { Metadata } from 'next';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ServiceExplorer } from '@/components/services/ServiceExplorer';
import { TechStack } from '@/components/home/TechStack';
import { ClosingCTA } from '@/components/ui/ClosingCTA';
import { ArchitectureVisual } from '@/components/hero-visuals/ArchitectureVisual';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Product engineering, cloud & DevOps, data & AI, mobile, security, and talent solutions — explore how Tech Pursuit Systems delivers.',
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Every capability your roadmap needs"
        description="Six focus areas, one delivery standard. Click through to see what each looks like in practice."
        visual={<ArchitectureVisual />}
        visualFramed={false}
      />

      <section className="bg-white py-6 md:py-8 lg:py-10">
        <div className="container-content">
          <SectionHeading
            eyebrow="Explore"
            title="What we deliver, in detail"
            className="mb-14"
          />
          <ServiceExplorer />
        </div>
      </section>

      <TechStack />

      <ClosingCTA
        title={
          <>
            Not sure which service
            <br />
            you need? Let’s scope it together.
          </>
        }
      />
    </>
  );
}
