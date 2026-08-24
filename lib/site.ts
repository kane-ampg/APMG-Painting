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

  /**
   * Geographic coordinates of the Chirnside Park base.
   *
   * Null until APMG confirms them. A service-area business is ranked partly on
   * a `GeoCircle` built from this point plus `serviceArea.radiusKm`, so this is
   * the single highest-value missing local signal — but a guessed latitude is
   * worse than none, because it moves the entity to a place APMG does not
   * work from. Geocode the published street address and paste the result.
   */
  coords: null as { latitude: number; longitude: number } | null,

  /**
   * Trading hours, as `openingHoursSpecification` entries.
   *
   * Null until APMG confirms them. The live site states none. Emitted into
   * LocalBusiness schema only when populated — inventing hours produces a rich
   * result that tells people to call when nobody is there.
   */
  openingHours: null as
    | readonly {
        days: readonly string[];
        opens: string;
        closes: string;
      }[]
    | null,

  social: {
    instagram: 'https://www.instagram.com/apmgpainting/',
    facebook: 'https://www.facebook.com/apmgpainting/',
    /**
     * Google Business Profile.
     *
     * Null until APMG supplies the profile URL. For a local trade business
     * this is the largest single ranking asset there is, and `sameAs` is how
     * the site tells Google that this entity and that profile are the same
     * business. Nothing else in this file matters as much for map-pack
     * visibility.
     */
    google: null as string | null,
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
 * Canonical origin, resolved in priority order.
 *
 * Vercel injects a declared-but-unset variable as an empty string, so a `??`
 * fallback is not enough here: an empty value has to be treated as absent, or
 * `new URL('')` throws during the metadata collection pass and fails the build.
 */
function normaliseOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  // Vercel's system host vars arrive bare (`apmg-painting.vercel.app`), and a
  // hand-entered domain usually does too. Assume https rather than reject it.
  const withProtocol = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).href.replace(/\/$/, '');
  } catch {
    return undefined;
  }
}

export const siteUrl =
  normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
  // No explicit origin on Vercel: use the stable production domain in
  // production and the per-deployment host everywhere else, so preview builds
  // never advertise production URLs in their sitemap, canonicals or JSON-LD.
  normaliseOrigin(
    process.env.VERCEL_ENV === 'production'
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL,
  ) ??
  'http://localhost:3000';

/** Sandbox guard — defaults to ON so the mock-up cannot be indexed. */
export const isSandbox = process.env.NEXT_PUBLIC_SANDBOX !== 'false';
