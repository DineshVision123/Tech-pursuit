import type { Metadata } from 'next';
import { Mail, MapPin, Clock } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { ContactForm } from '@/components/contact/ContactForm';
import { Reveal } from '@/components/ui/Reveal';
import { GlobeVisual } from '@/components/hero-visuals/GlobeVisual';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Tell us about your project — Tech Pursuit Systems typically replies within one business day.',
};

const officeInfo = [
  { icon: Mail, label: 'Email', value: 'hr@techpursuitsystems.com', href: 'mailto:hr@techpursuitsystems.com' },
  { icon: MapPin, label: 'Location', value: 'Atlanta, Georgia' },
  { icon: Clock, label: 'Response time', value: 'Within 1 business day' },
];

type ContactPageProps = {
  /**
   * `role` is set when arriving via a careers "Apply" link
   * (`/contact?role=<job title>`) — swaps this page from a general
   * project-inquiry pitch into a job-application one, and switches
   * `ContactForm` to its application fields instead of company/budget.
   */
  readonly searchParams: Promise<{ readonly role?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { role } = await searchParams;
  const isApplication = Boolean(role);

  return (
    <>
      <PageHero
        eyebrow={isApplication ? 'Careers' : 'Contact'}
        title={isApplication ? `Apply for ${role}` : 'Tell us what you’re building'}
        description={
          isApplication
            ? 'Tell us a bit about yourself and why this role is a fit — we review every application and reply within one business day.'
            : 'Whether it’s a full product build, a platform migration, or a staffing gap — start the conversation here.'
        }
        visual={<GlobeVisual />}
      />

      <section className="bg-surface-soft py-6 md:py-8 lg:py-10">
        <div className="container-content grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <ContactForm applyingForRole={role} />
          </Reveal>

          <div className="space-y-6">
            <Reveal className="card-elevated p-7">
              <h3 className="type-card text-ink-900">Reach us directly</h3>
              <div className="mt-5 space-y-4">
                {officeInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <item.icon size={16} />
                    </div>
                    <div>
                      <p className="type-badge text-ink-400">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="type-small text-ink-800 transition-colors hover:text-brand-600"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="type-small text-ink-800">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Stylized location panel — decorative, no fabricated address/geodata */}
            <Reveal className="relative overflow-hidden rounded-3xl bg-ink-950 p-7 text-white">
              <div className="absolute inset-0 opacity-40">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                  }}
                />
              </div>
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-gold-400 shadow-glow">
                  <MapPin size={18} className="text-white" />
                </div>
                <p className="type-secondary mt-5 text-ink-200">
                  Based in Atlanta, Georgia — serving clients across the US, in
                  your timezone, not just ours.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
