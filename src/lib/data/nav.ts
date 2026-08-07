import type { NavLink } from '@/types';

export const primaryNav: readonly NavLink[] = [
  { label: 'Services', href: '/services' },
  { label: 'Work', href: '/portfolio' },
  { label: 'Industries', href: '/industries' },
  { label: 'About', href: '/about' },
  { label: 'Careers', href: '/careers' },
];

export const footerNav: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Work',
    links: [
      { label: 'Services', href: '/services' },
      { label: 'Case Studies', href: '/portfolio' },
      { label: 'Industries', href: '/industries' },
    ],
  },
  {
    title: 'Talent Solutions',
    links: [
      { label: 'IT Staffing', href: '/services#talent' },
      { label: 'Open Roles', href: '/careers' },
    ],
  },
];
