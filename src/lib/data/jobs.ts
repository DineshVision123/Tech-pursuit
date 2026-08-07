import type { JobOpening } from '@/types';

/** PLACEHOLDER openings — replace with real roles from your ATS. */
export const jobs: readonly JobOpening[] = [
  {
    slug: 'senior-fullstack-engineer',
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (US)',
    type: 'Full-time',
    placeholder: true,
  },
  {
    slug: 'cloud-devops-engineer',
    title: 'Cloud & DevOps Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    placeholder: true,
  },
  {
    slug: 'product-designer',
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    placeholder: true,
  },
  {
    slug: 'technical-recruiter',
    title: 'Technical Recruiter',
    department: 'Talent Solutions',
    location: 'Remote (US)',
    type: 'Full-time',
    placeholder: true,
  },
] as const;
