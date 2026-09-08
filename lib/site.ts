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

  tagline: 'Commercial painters in Melbourne',

  phone: {
    display: '1300 97 97 40',
    href: 'tel:1300979740',
  },

  email: 'info@apmgpainting.com.au',

  /**
   * The Bayswater North office.
   *
   * APMG confirmed the move on 24 August 2026: out of Factory 15/30 Ramset Dr,
   * Chirnside Park VIC 3116, into 1 Turbo Drive, Bayswater North VIC 3153.
   * The site publishes the destination rather than the origin so that nothing
   * has to be rewritten on moving day.
   *
   * `effectiveFrom` exists because until the move completes this address
   * disagrees with the Google Business Profile, and an unexplained NAP
   * mismatch is a local-ranking cost. Surfaces that show the address render
   * the qualifier from `addressNote` alongside it while that date is in the
   * future, and drop it silently once the date passes — no follow-up edit,
   * no stale "we are moving" line left on the contact page a year later.
   */
  address: {
    street: '1 Turbo Drive',
    suburb: 'Bayswater North',
    state: 'VIC',
    postcode: '3153',
    country: 'AU',
    /** ISO date APMG occupies the new office. Client said "a couple of months". */
    effectiveFrom: '2026-10-01',
  },

  /**
   * Service area as APMG can actually evidence it. All five case studies are
   * Victorian and the office is in Bayswater North. The single
   * "throughout Australia" line on the live /commercial/ page is not carried
   * across — a separate VIC + QLD commercial site is planned instead.
   */
  serviceArea: {
    primary: 'Melbourne, Victoria',
    radiusKm: 60,
  },

  /**
   * Geographic coordinates of the Bayswater North base.
   *
   * Null until APMG confirms them. A service-area business is ranked partly on
   * a `GeoCircle` built from this point plus `serviceArea.radiusKm`, so this is
   * the single highest-value missing local signal — but a guessed latitude is
   * worse than none, because it moves the entity to a place APMG does not
   * work from. Geocode the published street address and paste the result.
   *
   * Still null after the August 2026 address change. The VIC + QLD commercial
   * spec carries a suburb-level geocode for Bayswater North
   * (-37.845116, 145.270141), but that is the suburb centroid, not 1 Turbo
   * Drive, and this field is what a GeoCircle is built from.
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
     * Resolved from the review widget on apmgpainting.com.au, which links to
     * `search.google.com/local/reviews?placeid=ChIJnV9lqRIw1moRftY3Ankvfdw`.
     * Stored in `maps.google.com/?q=place_id:` form because that is the URL
     * Google itself documents for `sameAs`.
     *
     * For a local trade business this is the largest single ranking asset there
     * is, and `sameAs` is how the site tells Google that this entity and that
     * profile are the same business. Nothing else in this file matters as much
     * for map-pack visibility.
     *
     * NOTE: the profile is still registered to Chirnside Park. It has to be
     * updated to Bayswater North when APMG moves, or the site and the profile
     * will disagree on the one fact the map pack cares most about.
     */
    google: 'https://www.google.com/maps/place/?q=place_id:ChIJnV9lqRIw1moRftY3Ankvfdw',
  },
} as const;

/**
 * Accreditations.
 *
 * `verified` means APMG has confirmed the credential and it may be published.
 * Unverified entries never render as a credential and never reach structured
 * data — an unverified claim is worse than a missing one.
 *
 * Every entry was false until 24 August 2026, when APMG confirmed the set and
 * pointed at apmgpainting.com.au as the source. `evidence` records how each one
 * was established, because "the client said so" and "there is a current
 * certificate on file" are different strengths of claim and the difference
 * should survive in the repo rather than in somebody's memory.
 *
 * Two corrections from the original audit are kept: the body is Master Painters
 * Australia (the live site names it five different ways), and the NDIS
 * credential is a Worker Screening Check, not an "NDIS Accreditation".
 *
 * Cm3 and Haymes are new. Neither was on APMG's list; both are badged on the
 * live site, which is the source APMG nominated. Cm3 in particular is a
 * contractor OHS prequalification that education, health and facilities clients
 * screen on, so it is the most commercially useful badge of the set.
 */
export type Accreditation = {
  id: string;
  /** Exact, correctly capitalised name. */
  label: string;
  detail: string;
  /** Publishable. Only true entries render or reach structured data. */
  verified: boolean;
  /** How the credential was established. Never rendered; provenance only. */
  evidence: string;
  /**
   * The body's mark, where APMG's own site carries one. Absent for the
   * personnel screening checks, which are held per-person and have no badge.
   */
  logo?: {
    src: string;
    width: number;
    height: number;
    alt: string;
  };
};

const CLIENT_CONFIRMED = 'APMG confirmed 2026-08-24; logo taken from apmgpainting.com.au' as const;

export const accreditations: readonly Accreditation[] = [
  {
    id: 'master-painters',
    label: 'Master Painters Australia',
    detail: 'Registered Master Painter',
    verified: true,
    evidence: CLIENT_CONFIRMED,
    logo: {
      src: '/images/accreditations/master-painters-australia.webp',
      width: 444,
      height: 390,
      alt: 'Master Painters Australia',
    },
  },
  {
    id: 'dulux',
    label: 'Dulux Accredited Painter',
    detail: 'Supports the 5-year workmanship warranty',
    verified: true,
    evidence: CLIENT_CONFIRMED,
    logo: {
      src: '/images/accreditations/dulux-accredited-painter.webp',
      width: 197,
      height: 98,
      alt: 'Dulux Accredited Painter',
    },
  },
  {
    id: 'cm3',
    label: 'Cm3 prequalified',
    detail: 'Contractor OHS prequalification, recognised across education, health and facilities',
    verified: true,
    evidence: CLIENT_CONFIRMED,
    logo: {
      src: '/images/accreditations/cm3.webp',
      width: 182,
      height: 84,
      alt: 'Cm3 contractor OHS prequalification',
    },
  },
  {
    id: 'haymes',
    label: 'Haymes Paint',
    detail: 'Accredited applicator for the Australian-made Haymes range',
    verified: true,
    evidence: CLIENT_CONFIRMED,
    logo: {
      src: '/images/accreditations/haymes-paint.webp',
      width: 178,
      height: 92,
      alt: 'Haymes Paint',
    },
  },
  {
    id: 'insured',
    label: 'Fully insured',
    detail: 'Public liability and workers compensation',
    verified: true,
    // No badge and no certificate on file — this one rests on APMG's word.
    // Certificates of currency are the thing to collect: a facilities manager
    // will ask for them by name before a purchase order is raised.
    evidence: 'APMG confirmed 2026-08-24; certificates of currency not yet supplied',
  },
  {
    id: 'wwcc',
    label: 'Working with Children Checks',
    detail: 'Held by personnel working on education and childcare sites',
    verified: true,
    evidence: 'APMG confirmed 2026-08-24; held per person, no company-level certificate',
  },
  {
    id: 'police-check',
    label: 'Police checks',
    detail: 'Held by personnel working on healthcare and aged care sites',
    verified: true,
    evidence: 'APMG confirmed 2026-08-24; held per person, no company-level certificate',
  },
  {
    id: 'ndis-screening',
    label: 'NDIS Worker Screening Check',
    detail: 'Held by personnel working on NDIS sites',
    verified: true,
    evidence: 'APMG confirmed 2026-08-24; held per person, no company-level certificate',
  },
] as const;

export const verifiedAccreditations = accreditations.filter((a) => a.verified);

/**
 * The logo wall. Four marks, in the order APMG's own site shows them.
 *
 * The screening checks are deliberately not here: they are held per person, so
 * a badge implying a company-level certification would overstate them. They are
 * stated in words on the about page instead.
 */
export const accreditationLogos = verifiedAccreditations.filter((a) => a.logo !== undefined);

/** Formatted one-line address for the footer and contact page. */
export const formattedAddress = [
  site.address.street,
  `${site.address.suburb} ${site.address.state} ${site.address.postcode}`,
].join(', ');

/** The address APMG occupies until the Bayswater North move completes. */
export const previousAddress = 'Factory 15/30 Ramset Dr, Chirnside Park VIC 3116';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * The qualifier that runs beside the address until the move completes, or null
 * once it has.
 *
 * Formatted by hand rather than through `toLocaleDateString`, because month
 * names from ICU differ between the build container and a developer's machine
 * and this string is baked into static HTML.
 *
 * `now` is injectable so the expiry is testable without touching the clock.
 */
export function addressNote(now: Date = new Date()): string | null {
  const effective = new Date(`${site.address.effectiveFrom}T00:00:00Z`);
  if (Number.isNaN(effective.getTime()) || now >= effective) return null;

  const month = MONTHS[effective.getUTCMonth()];
  return `Our office from ${month} ${effective.getUTCFullYear()}. Until then we work from ${previousAddress}.`;
}

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
