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
   * The office.
   *
   * 1 Turbo Drive, Bayswater North VIC 3153, confirmed by APMG on
   * 25 August 2026 as the company's address — not a future one. An earlier
   * revision carried an `effectiveFrom` date and a self-expiring "we are
   * moving" qualifier beside the address on every surface that showed it;
   * that qualifier is gone, because there is no longer a transition to
   * describe. The address is simply the address.
   *
   * The one outstanding job this creates is external: the Google Business
   * Profile in `social.google` is still registered to Chirnside Park. Until
   * it is updated the site and the profile disagree on the fact the map pack
   * weighs most heavily, and no amount of on-site markup fixes that.
   */
  address: {
    street: '1 Turbo Drive',
    suburb: 'Bayswater North',
    state: 'VIC',
    postcode: '3153',
    country: 'AU',
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
   * Still null. The VIC + QLD commercial spec carries a suburb-level geocode
   * for Bayswater North (-37.845116, 145.270141), but that is the suburb
   * centroid, not 1 Turbo Drive, and this field is what a GeoCircle is built
   * from.
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
     * updated to the Bayswater North address above, or the site and the
     * profile will disagree on the one fact the map pack cares most about.
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
      src: '/images/accreditations/master-painters-australia.png',
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
      src: '/images/accreditations/dulux-accredited-painter.png',
      width: 197,
      height: 98,
      alt: 'Dulux Accredited Painter',
    },
  },
  {
    id: 'workmanship-warranty',
    label: "Painter's workmanship warranty",
    detail: 'Five years, covering peeling, flaking and blistering',
    verified: true,
    /*
     * The one mark on this list that was on APMG's live site and nowhere on
     * the rebuild. It arrives from that site as one file with the Dulux badge
     * beside it — two marks set side by side with 14px of clear space between
     * them, not a designed lockup — so it is split back into its two halves
     * here and each is framed on its own.
     *
     * Kept whole, the pair had to render at a third the height of a single
     * mark to fit one frame, and the shield's own wording stopped being
     * readable. Split, both sit at the size the rest of the row does.
     */
    evidence:
      'APMG confirmed 2026-08-24; mark taken from apmgpainting.com.au 2026-08-25, split from the Dulux + warranty pair used there',
    logo: {
      src: '/images/accreditations/painters-workmanship-warranty.png',
      width: 95,
      height: 107,
      alt: "Painter's workmanship warranty, five year",
    },
  },
  {
    id: 'cm3',
    label: 'Cm3 prequalified',
    detail: 'Contractor OHS prequalification, recognised across education, health and facilities',
    verified: true,
    evidence: CLIENT_CONFIRMED,
    logo: {
      src: '/images/accreditations/cm3.png',
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
      src: '/images/accreditations/haymes-paint.png',
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

/**
 * Directions to the office, as Google's documented `dir` deep link.
 *
 * Built from the street address rather than from `site.social.google`. That
 * profile still carries the Chirnside Park place ID, so a place-ID link would
 * route a visitor to the previous premises — the one navigation error on this
 * page that actually costs somebody a morning. A plain address query is
 * resolved by Maps itself and cannot go stale behind us.
 */
export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  `${formattedAddress}, Australia`,
)}`;

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
