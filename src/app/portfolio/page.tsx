import type { Metadata } from 'next';
import { PageHero } from '@/components/ui/PageHero';
import { ProjectGallery } from '@/components/portfolio/ProjectGallery';
import { ClosingCTA } from '@/components/ui/ClosingCTA';
import { DeviceMockupsVisual } from '@/components/hero-visuals/DeviceMockupsVisual';

export const metadata: Metadata = {
  title: 'Portfolio',
  description:
    'Explore case studies across fintech, healthcare, retail, logistics, SaaS, and manufacturing engagements.',
};

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Work"
        title="Products shipped, problems solved"
        description="A sample of the engagement types we take on — filter by industry to see relevant work."
        visual={<DeviceMockupsVisual />}
        visualFramed={false}
      />

      <section className="bg-white py-6 md:py-8 lg:py-10">
        <div className="container-content">
          <ProjectGallery />
        </div>
      </section>

      <ClosingCTA
        title={
          <>
            Want to see how this
            <br />
            translates to your product?
          </>
        }
      />
    </>
  );
}
