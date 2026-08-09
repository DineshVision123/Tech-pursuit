import { Hero } from '@/components/home/Hero';
import { HeroTrustBar } from '@/components/home/HeroTrustBar';
import { ServicesGrid } from '@/components/home/ServicesGrid';
import { WhyChoose } from '@/components/home/WhyChoose';
import { OurProcess } from '@/components/home/OurProcess';
import { CaseStudies } from '@/components/home/CaseStudies';
import { TechStack } from '@/components/home/TechStack';
import { IndustriesStrip } from '@/components/home/IndustriesStrip';
import { Testimonials } from '@/components/home/Testimonials';
import { TalentSolutions } from '@/components/home/TalentSolutions';
import { ContactCTA } from '@/components/home/ContactCTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <HeroTrustBar />
      <ServicesGrid />
      <WhyChoose />
      <OurProcess />
      <CaseStudies />
      <TechStack />
      <IndustriesStrip />
      <Testimonials />
      <TalentSolutions />
      <ContactCTA />
    </>
  );
}
