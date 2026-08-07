import type { Project } from '@/types';

/**
 * PLACEHOLDER CASE STUDIES.
 * No real client names or metrics — generic project archetypes only.
 * Replace with real, permissioned case studies before this ships publicly.
 */
export const projects: readonly Project[] = [
  {
    slug: 'fintech-platform-modernization',
    name: 'Fintech Platform Modernization',
    industry: 'Financial Services',
    summary:
      'Replaced a decade-old monolith with a modular platform, cutting release cycles from weeks to days.',
    outcome: 'Faster releases, zero-downtime deploys',
    tags: ['Platform Engineering', 'Cloud Migration'],
    metric: { label: 'Deploy frequency', value: '10x' },
    placeholder: true,
  },
  {
    slug: 'healthcare-patient-portal',
    name: 'Healthcare Patient Portal',
    industry: 'Healthcare',
    summary:
      'Designed and built a HIPAA-conscious patient portal with appointment scheduling and secure messaging.',
    outcome: 'Streamlined patient access, reduced call volume',
    tags: ['Product Engineering', 'UX'],
    metric: { label: 'Support calls', value: '-38%' },
    placeholder: true,
  },
  {
    slug: 'retail-demand-forecasting',
    name: 'Retail Demand Forecasting Engine',
    industry: 'Retail & eCommerce',
    summary:
      'Built a forecasting pipeline that ingests POS and inventory data to predict demand at the SKU level.',
    outcome: 'Reduced overstock, improved fulfillment',
    tags: ['Data & AI', 'Cloud'],
    metric: { label: 'Inventory waste', value: '-22%' },
    placeholder: true,
  },
  {
    slug: 'logistics-fleet-app',
    name: 'Logistics Fleet Management App',
    industry: 'Logistics',
    summary:
      'Cross-platform mobile app giving dispatchers and drivers real-time visibility into fleet operations.',
    outcome: 'Faster dispatch, fewer missed windows',
    tags: ['Mobile', 'Real-time Systems'],
    metric: { label: 'Dispatch time', value: '-45%' },
    placeholder: true,
  },
  {
    slug: 'saas-billing-rebuild',
    name: 'B2B SaaS Billing Rebuild',
    industry: 'SaaS',
    summary:
      'Rebuilt a usage-based billing system to support tiered pricing, proration, and automated dunning.',
    outcome: 'Reliable billing at scale',
    tags: ['Product Engineering', 'Payments'],
    metric: { label: 'Billing disputes', value: '-60%' },
    placeholder: true,
  },
  {
    slug: 'enterprise-data-lakehouse',
    name: 'Enterprise Data Lakehouse',
    industry: 'Manufacturing',
    summary:
      'Consolidated fragmented plant data into a governed lakehouse feeding executive dashboards.',
    outcome: 'Single source of truth for operations',
    tags: ['Data & AI', 'Cloud'],
    metric: { label: 'Reporting lag', value: '-90%' },
    placeholder: true,
  },
] as const;
