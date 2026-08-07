import type { LucideIcon } from 'lucide-react';

export type ServiceCategory = {
  readonly slug: string;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly image: string;
  readonly capabilities: readonly string[];
  readonly technologies: readonly string[];
};

export type Project = {
  readonly slug: string;
  readonly name: string;
  readonly industry: string;
  readonly summary: string;
  readonly outcome: string;
  readonly tags: readonly string[];
  readonly metric: { readonly label: string; readonly value: string };
  readonly placeholder: true;
};

export type Testimonial = {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly placeholder: true;
};

export type Industry = {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly image: string;
};

export type Technology = {
  readonly name: string;
  readonly category: 'Frontend' | 'Backend' | 'Cloud & DevOps' | 'Data & AI' | 'Mobile';
};

export type JobOpening = {
  readonly slug: string;
  readonly title: string;
  readonly department: string;
  readonly location: string;
  readonly type: string;
  readonly placeholder: true;
};

export type NavLink = {
  readonly label: string;
  readonly href: string;
};

export type ContactFormValues = {
  readonly name: string;
  readonly email: string;
  readonly company?: string;
  readonly budget?: string;
  /** Job title, only present when the form was reached via a careers "Apply" link. */
  readonly role?: string;
  /** Portfolio/LinkedIn/resume URL, only present in the careers application form. */
  readonly portfolioUrl?: string;
  readonly message: string;
};
