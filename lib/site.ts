/**
 * Canonical business facts — the single source of truth.
 *
 * The live WordPress site renders the company name four different ways
 * ("APMG Painting", "APMG Painting Services", "APMG Services",
 * "APMG Painting Services Pty Ltd") plus one typo ("AMPG"). Every surface that
 * states a business fact — footer, contact page, JSON-LD, metadata, forms —
 * imports from here, so that drift cannot recur.
 *
 * Anything marked NEEDS-CLIENT-CONFIRMATION is not rendered publicly until
 * APMG supplies it. Nothing here is invented.
 */

export const CONTACT_UNVERIFIED = 'NEEDS-CLIENT-CONFIRMATION' as const;

export const site = {
  /** Trading name. Use this everywhere in prose and headings. */
  name: 'APMG Painting',

  /**
   * Registered entity. Sourced from the live /about-us/ page, which reads
   * "APMG Painting Services PTY LTD was founded in 2015". Use only in the
   * footer legal line and in Organization schema `legalName`.
   */
  legalName: 'APMG Painting Services Pty Ltd',

  /** Not published anywhere on the live site. Required for LocalBusiness schema. */
  abn: null as string | null,

  founded: 2015,

  tagline: 'Commercial and residential painters in Melbourne',

  phone: {
    display: '1300 97 97 40',
    href: 'tel:1300979740',
  },

  email: 'info@apmgpainting.com.au',

  address: {
    street: 'Factory 15/30 Ramset Dr',
    suburb: 'Chirnside Park',
    state: 'VIC',
    postcode: '3116',
    country: 'AU',
  },

  /**
   * Service area as APMG can actually evidence it. All five case studies are
   * Victorian and the office is in Chirnside Park. The single
   * "throughout Australia" line on the live /commercial/ page is not carried
   * across — a separate VIC + QLD commercial site is planned instead.
   */
  serviceArea: {
    primary: 'Melbourne, Victoria',
    radiusKm: 60,
  },

  social: {
    instagram: 'https://www.instagram.com/apmgpainting/',
    facebook: 'https://www.facebook.com/apmgpainting/',
  },
} as const;

/**
 * Accreditations.
 *
 * `verified` means APMG has supplied a certificate. Only verified entries are
 * rendered as trust indicators or emitted in structured data — an unverified
 * claim is worse than a missing one.
 *
 * Every entry is currently false: the audit found five different renderings of
 * the Master Painters body, a non-existent body ("registered with Workplace
 * Safety"), and "NDIS Accreditation" where the real credential is an NDIS
 * Worker Screening Check. All are pending certificates from APMG.
 */
export type Accreditation = {
  id: string;
  /** Exact, correctly capitalised name. */
  label: string;
  detail: string;
  verified: boolean;
};

export const accreditations: readonly Accreditation[] = [
  {
    id: 'master-painters',
    label: 'Master Painters Australia',
    detail: 'Registered Master Painter',
    verified: false,
  },
  {
    id: 'dulux',
    label: 'Dulux Accredited Painter',
    detail: 'Supports the 5-year workmanship warranty',
    verified: false,
  },
  {
    id: 'insured',
    label: 'Fully insured',
    detail: 'Public liability and workers compensation',
    verified: false,
  },
  {
    id: 'wwcc',
    label: 'Working with Children Checks',
    detail: 'Held by personnel working on education and childcare sites',
    verified: false,
  },
  {
    id: 'police-check',
    label: 'Police checks',
    detail: 'Held by personnel working on healthcare and aged care sites',
    verified: false,
  },
  {
    id: 'ndis-screening',
    label: 'NDIS Worker Screening Check',
    detail: 'Held by personnel working on NDIS sites',
    verified: false,
  },
] as const;

export const verifiedAccreditations = accreditations.filter((a) => a.verified);

/** Formatted one-line address for the footer and contact page. */
export const formattedAddress = [
  site.address.street,
  `${site.address.suburb} ${site.address.state} ${site.address.postcode}`,
].join(', ');

/**
 * Canonical origin. Falls back to localhost so builds never emit a wrong
 * absolute URL by accident.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/** Sandbox guard — defaults to ON so the mock-up cannot be indexed. */
export const isSandbox = process.env.NEXT_PUBLIC_SANDBOX !== 'false';
