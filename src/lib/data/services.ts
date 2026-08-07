import {
  LayoutTemplate,
  Cloud,
  BrainCircuit,
  ShieldCheck,
  Smartphone,
  Users,
  Palette,
  ShoppingCart,
  Plug,
  Compass,
} from 'lucide-react';
import type { ServiceCategory } from '@/types';

/**
 * Core service catalogue. Recruitment ("Talent Solutions") is intentionally
 * listed last and framed as a supporting capability, per brand positioning.
 */
export const services: readonly ServiceCategory[] = [
  {
    slug: 'product-engineering',
    title: 'Product Engineering',
    tagline: 'From idea to shipped product',
    description:
      'Full-cycle web and platform engineering — architecture, design systems, and production-grade builds that scale with your business.',
    icon: LayoutTemplate,
    image: '/images/services/product-engineering.webp',
    capabilities: [
      'Web & SaaS platforms',
      'Design systems & UI engineering',
      'API & integration architecture',
      'Legacy modernization',
    ],
    technologies: ['Next.js', 'React', 'TypeScript', 'Node.js'],
  },
  {
    slug: 'cloud-devops',
    title: 'Cloud & DevOps',
    tagline: 'Infrastructure that doesn’t sleep',
    description:
      'Cloud-native infrastructure, CI/CD pipelines, and observability built for reliability at scale — AWS, Azure, and GCP.',
    icon: Cloud,
    image: '/images/services/cloud-devops.webp',
    capabilities: [
      'Cloud architecture & migration',
      'CI/CD automation',
      'Infrastructure as code',
      'Cost & performance optimization',
    ],
    technologies: ['AWS', 'Kubernetes', 'Terraform', 'Docker'],
  },
  {
    slug: 'data-ai',
    title: 'Data & AI',
    tagline: 'Decisions backed by data',
    description:
      'Data platforms, analytics pipelines, and applied AI — from predictive models to production LLM-powered features.',
    icon: BrainCircuit,
    image: '/images/services/data-ai.webp',
    capabilities: [
      'Data engineering & warehousing',
      'AI/ML product features',
      'LLM & agent integrations',
      'Business intelligence',
    ],
    technologies: ['Python', 'PostgreSQL', 'Airflow', 'LLM APIs'],
  },
  {
    slug: 'mobile',
    title: 'Mobile Applications',
    tagline: 'Native feel, cross-platform speed',
    description:
      'Consumer and enterprise mobile apps built for performance, with a single codebase across iOS and Android.',
    icon: Smartphone,
    image: '/images/services/mobile.webp',
    capabilities: [
      'iOS & Android apps',
      'Cross-platform architecture',
      'App store readiness',
      'Offline-first design',
    ],
    technologies: ['React Native', 'Swift', 'Kotlin', 'Expo'],
  },
  {
    slug: 'ux-ui-design',
    title: 'Product Design (UX/UI)',
    tagline: 'Interfaces people actually enjoy',
    description:
      'Research-backed UX, interaction design, and design systems that make complex products feel simple to use.',
    icon: Palette,
    image: '/images/services/ux-ui-design.webp',
    capabilities: [
      'User research & journey mapping',
      'Wireframing & prototyping',
      'Design systems',
      'Usability testing',
    ],
    technologies: ['Figma', 'Design Tokens', 'Storybook', 'Prototyping'],
  },
  {
    slug: 'ecommerce-solutions',
    title: 'eCommerce Solutions',
    tagline: 'Storefronts built to convert',
    description:
      'Headless commerce builds, checkout optimization, and catalog architecture for brands that sell online at scale.',
    icon: ShoppingCart,
    image: '/images/services/ecommerce-solutions.webp',
    capabilities: [
      'Headless commerce architecture',
      'Checkout & payments integration',
      'Catalog & inventory systems',
      'Conversion-rate optimization',
    ],
    technologies: ['Shopify', 'Stripe', 'Next.js Commerce', 'Algolia'],
  },
  {
    slug: 'enterprise-integration',
    title: 'Enterprise Integration',
    tagline: 'Your systems, finally talking to each other',
    description:
      'ERP, CRM, and third-party API integrations that connect fragmented systems into one reliable data flow.',
    icon: Plug,
    image: '/images/services/enterprise-integration.webp',
    capabilities: [
      'ERP & CRM integration',
      'API design & middleware',
      'Event-driven architecture',
      'Legacy system connectors',
    ],
    technologies: ['REST/GraphQL', 'Webhooks', 'Kafka', 'Salesforce APIs'],
  },
  {
    slug: 'it-consulting',
    title: 'Digital Strategy & IT Consulting',
    tagline: 'The roadmap before the build',
    description:
      'Technology audits, architecture reviews, and modernization roadmaps for teams that need a plan before they build.',
    icon: Compass,
    image: '/images/services/it-consulting.webp',
    capabilities: [
      'Technology audits',
      'Architecture & vendor reviews',
      'Modernization roadmaps',
      'Build-vs-buy analysis',
    ],
    technologies: ['Architecture Reviews', 'Roadmapping', 'Cost Modeling'],
  },
  {
    slug: 'security-qa',
    title: 'Security & Quality',
    tagline: 'Confidence, built in',
    description:
      'Security reviews, compliance readiness, and automated quality gates baked into every release — not bolted on after.',
    icon: ShieldCheck,
    image: '/images/services/security-qa.webp',
    capabilities: [
      'Application security review',
      'Automated test coverage',
      'Compliance readiness',
      'Performance & load testing',
    ],
    technologies: ['OWASP', 'Playwright', 'Vitest', 'SOC 2 practices'],
  },
  {
    slug: 'talent-solutions',
    title: 'Talent Solutions',
    tagline: 'The right engineers, on demand',
    description:
      'Vetted IT talent and dedicated teams that plug into your workflow — a supporting capability alongside our product work.',
    icon: Users,
    image: '/images/services/talent-solutions.webp',
    capabilities: [
      'IT staffing',
      'Contract & contract-to-hire',
      'Dedicated engineering teams',
      'Resource augmentation',
    ],
    technologies: ['Pre-vetted talent pool', 'Fast ramp-up', 'Flexible engagement'],
  },
] as const;
