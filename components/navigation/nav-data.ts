import { sectors } from '@/content/sectors';

export type NavChild = { label: string; href: string; description?: string };
export type NavItem = { label: string; href: string; children?: NavChild[] };

/**
 * Main navigation.
 *
 * Commercial leads, and its dropdown surfaces the eight sector pages that on
 * the live site appear in the footer only. Projects is promoted out of the
 * footer because it is the strongest evidence the business has.
 *
 * Sector hrefs use each sector's existing `legacyPath` so no indexed URL moves.
 */
export const mainNav: readonly NavItem[] = [
  {
    label: 'Commercial',
    href: '/commercial/',
    children: [
      { label: 'Commercial painting', href: '/commercial/', description: 'Overview' },
      { label: 'Office painting', href: '/office-painters/' },
      ...sectors
        .filter((s) => s.legacyPath !== '/commercial/')
        .map((s) => ({ label: s.shortTitle, href: s.legacyPath })),
    ],
  },
  {
    label: 'Service Areas',
    href: '/areas/',
    children: [
      { label: 'Service areas', href: '/areas/', description: 'Overview' },
      { label: 'Victoria', href: '/areas/victoria/' },
      { label: 'Queensland', href: '/areas/queensland/' },
    ],
  },
  { label: 'Projects', href: '/projects/' },
  { label: 'Trade services', href: '/trade-services/' },
  { label: 'About', href: '/about-us/' },
  { label: 'Contact', href: '/contact-us/' },
] as const;

export const footerNav = {
  commercial: [
    { label: 'Commercial painting', href: '/commercial/' },
    { label: 'Office painting', href: '/office-painters/' },
    ...sectors.map((s) => ({ label: s.shortTitle, href: s.legacyPath })),
  ],
  company: [
    { label: 'About us', href: '/about-us/' },
    { label: 'Projects', href: '/projects/' },
    { label: 'Contact us', href: '/contact-us/' },
  ],
  areas: [
    { label: 'Service areas', href: '/areas/' },
    { label: 'Victoria', href: '/areas/victoria/' },
    { label: 'Queensland', href: '/areas/queensland/' },
  ],
} as const;
