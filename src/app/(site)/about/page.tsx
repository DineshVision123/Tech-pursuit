import type { Metadata } from 'next';
import { Target, Eye, Handshake, Lightbulb, Zap, Rocket, Users2, TrendingUp, Globe } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { ClosingCTA } from '@/components/ui/ClosingCTA';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { InnovationTimelineVisual } from '@/components/hero-visuals/InnovationTimelineVisual';
import { cn } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Tech Pursuit Systems is a technology partner first — engineering premium software, with talent solutions as a supporting capability.',
};

const values = [
  { icon: Zap, title: 'Move with intent', body: 'Speed without a plan is just noise. We move fast because we plan well.' },
  { icon: Handshake, title: 'Partner, don’t vendor', body: 'We push back when it matters — that’s what partners do.' },
  { icon: Lightbulb, title: 'Curiosity over ego', body: 'The best idea wins, regardless of whose title is attached to it.' },
];

const companyStats = [
  { value: 120, suffix: '+', label: 'Products shipped', icon: Rocket, tone: 'brand' as const },
  { value: 40, suffix: '+', label: 'Engineers & specialists', icon: Users2, tone: 'gold' as const },
  { value: 98, suffix: '%', label: 'Client retention', icon: TrendingUp, tone: 'gold' as const },
  { value: 6, suffix: '', label: 'Industries served', icon: Globe, tone: 'brand' as const },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Technology partner first. Everything else follows."
        description="Tech Pursuit Systems was built to close the gap between ambitious roadmaps and the engineering talent required to ship them."
        visual={<InnovationTimelineVisual />}
      />

      {/* Company Story — text + stat panel, asymmetric */}
      <section className="bg-white py-6 md:py-8 lg:py-10">
        <div className="container-content grid grid-cols-1 gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Our Story"
              title="Founded on a simple frustration"
              description={
                <>
                  Too many software projects fail not from bad ideas, but from
                  mismatched execution — the wrong team, the wrong architecture,
                  or simply the wrong pace. Tech Pursuit Systems exists to close
                  that gap: senior engineers, clear architecture, and delivery
                  discipline applied to products that matter.
                  <br />
                  <br />
                  What started as a small product engineering team has grown
                  into a full digital transformation partner — while staying
                  deliberately senior, deliberately focused, and deliberately
                  small enough to move fast.
                </>
              }
            />
          </div>
          <Reveal className="grid grid-cols-2 gap-5">
            {companyStats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1',
                  stat.tone === 'brand'
                    ? 'border-brand-200/70 bg-gradient-to-br from-brand-50 to-white hover:border-brand-300 hover:shadow-glow'
                    : 'border-gold-200/70 bg-gradient-to-br from-gold-50 to-white hover:border-gold-300 hover:shadow-glow-gold',
                )}
              >
                {/* Faint dot-grid texture, same technique as the contact
                    page's location panel — keeps these cards from reading
                    as flat, plain rectangles. */}
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, rgba(15,20,36,0.07) 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />
                <div
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-glow transition-transform duration-300 group-hover:scale-105',
                    stat.tone === 'brand'
                      ? 'bg-gradient-to-br from-brand-500 to-brand-600'
                      : 'bg-gradient-to-br from-gold-500 to-gold-600',
                  )}
                >
                  <stat.icon size={18} strokeWidth={1.8} />
                </div>
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  className="type-heading relative mt-4 block font-display text-ink-900"
                />
                <p className="type-small relative mt-1.5 text-ink-500">{stat.label}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Mission & Vision — two-tone split panel. Each side gets a faint
          blueprint-grid texture and a corner glow (gold on the dark panel,
          white on the blue one) so neither reads as a flat color block —
          same technique as HeroAmbientBackdrop/InnovationTimelineVisual,
          reused here rather than left plain. */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        <div className="relative overflow-hidden bg-ink-950 p-10 py-6 text-white sm:p-16 md:py-8 lg:py-10">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" />
          <Reveal className="relative">
            <div className="glass flex h-14 w-14 items-center justify-center rounded-2xl">
              <Target size={24} className="text-gold-400" />
            </div>
            <h3 className="type-card mt-6">Our Mission</h3>
            <div className="mt-3 h-0.5 w-10 rounded-full bg-gradient-to-r from-gold-400 to-gold-500/30" />
            <p className="type-body mt-5 text-ink-300">
              Give ambitious companies senior-grade engineering without the
              overhead of building that capability in-house from scratch.
            </p>
          </Reveal>
        </div>
        <div className="relative overflow-hidden bg-brand-600 p-10 py-6 text-white sm:p-16 md:py-8 lg:py-10">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <Reveal className="relative">
            <div className="glass flex h-14 w-14 items-center justify-center rounded-2xl">
              <Eye size={24} className="text-white" />
            </div>
            <h3 className="type-card mt-6">Our Vision</h3>
            <div className="mt-3 h-0.5 w-10 rounded-full bg-gradient-to-r from-white to-white/20" />
            <p className="type-body mt-5 text-brand-100">
              To be the technology partner ambitious companies call first —
              recognized for craft, not just capacity.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Team & Culture — values grid (no fabricated individual bios/photos) */}
      <section className="bg-surface-soft py-6 md:py-8 lg:py-10">
        <div className="container-content">
          <SectionHeading
            eyebrow="Team & Culture"
            title="How we work together"
            description="A small set of principles that shape every engagement, every code review, and every hire."
            align="center"
            className="mx-auto"
          />
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {values.map((value) => (
              <Reveal key={value.title} className="card-elevated p-8 text-center">
                <value.icon size={26} className="mx-auto text-brand-600" strokeWidth={1.6} />
                <h3 className="type-card mt-5 text-ink-900">{value.title}</h3>
                <p className="type-small mt-2 text-ink-500">{value.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ClosingCTA
        title={
          <>
            Curious what senior-grade
            <br />
            engineering feels like?
          </>
        }
      />
    </>
  );
}
