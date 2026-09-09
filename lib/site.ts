/**
 * Canonical business facts, and the seed for the ones an editor may change.
 *
 * The trading and legal names, the founding year, the tagline and the
 * accreditations are code and stay here: the one-company-name rule below is
 * not editable copy. The contact facts — phone, email, address, ABN, coords,
 * hours, socials — now live in the CMS `settings/site` singleton, and this
 * file supplies `defaultSiteSettings`, which seeds that row and answers when
 * there is no database. Read them through `getSiteSettings()`, never from
 * `site.*`.
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

import type { ContactPageCopy, SiteSettings } from '@/lib/content/types';

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
    /**
     * Country-coded form for structured data. Google's LocalBusiness guidance
     * asks for the number with its country code; prose and the header keep
     * the local display format above.
     */
    international: '+61 1300 979 740',
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

/**
 * Seed and fallback for the CMS `settings/site` entry. Once seeded, the
 * database wins; this object only answers when there is no database.
 * Values are the ones that were hard-coded here before the CMS existed, so
 * nothing is retyped and the two cannot drift.
 */
export const defaultSiteSettings: SiteSettings = {
  phone: site.phone.display,
  email: site.email,
  address: {
    street: site.address.street,
    suburb: site.address.suburb,
    state: site.address.state,
    postcode: site.address.postcode,
    country: site.address.country,
    // No transition to describe: 1 Turbo Drive is the address APMG occupies,
    // not a future one. The field stays because an editor may set a move date
    // in /admin later, at which point the note appears on its own.
    effectiveFrom: null,
  },
  previousAddress: null,
  abn: site.abn,
  coords: site.coords,
  openingHours: site.openingHours,
  serviceAreaPrimary: site.serviceArea.primary,
  social: {
    instagram: site.social.instagram,
    facebook: site.social.facebook,
    google: site.social.google,
  },
};

/**
 * Directions to the office, as Google's documented `dir` deep link.
 *
 * Built from the street address rather than from `site.social.google`. That
 * profile still carries the Chirnside Park place ID, so a place-ID link would
 * route a visitor to the previous premises — the one navigation error on this
 * page that actually costs somebody a morning. A plain address query is
 * resolved by Maps itself and cannot go stale behind us.
 *
 * Takes the address rather than reading it, so an editor who moves the office
 * in /admin moves the deep link with it.
 */
export function directionsUrl(address: SiteSettings['address']): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${formatAddress(address)}, Australia`,
  )}`;
}

/**
 * Seed and fallback for the CMS `pages/contact-us` entry. The copy is the
 * copy /contact-us/ carried before it became editable.
 */
export const defaultContactPage: ContactPageCopy = {
  slug: 'contact-us',
  title: 'Talk to us about the site',
  lede: 'Tell us the building, the areas involved and when we are allowed on site. Those three answers are what decide whether a site assessment can be scheduled — the rest follows from them.',
  formHeading: 'Request a site assessment',
  formIntro:
    'For schools, clinics, aged care, strata, retail, hospitality, offices and industrial sites. The operating-hours question matters more than any other — tell us when we are allowed on site.',
  metaTitle: 'Contact APMG Painting | Melbourne Painters',
  metaDescription:
    'Contact APMG Painting. Tell us about the site and the scope, or call 1300 97 97 40 for a commercial site assessment.',
};

/**
 * The tel: link, derived from the display number rather than stored beside
 * it — two fields that have to agree are two fields that eventually do not.
 * Pure, so client components may import it; this module has no `server-only`.
 */
export function phoneHref(display: string): string {
  return `tel:${display.replace(/\D/g, '')}`;
}

/**
 * The display number in country-coded form, for structured data.
 *
 * Google's LocalBusiness guidance asks for the number with its country code
 * while prose and the header keep the local display format. Derived rather
 * than stored beside the display number for the same reason `phoneHref` is:
 * two fields that have to agree eventually do not, and the editable one is
 * the one an editor types.
 */
export function internationalPhone(display: string): string {
  const digits = display.replace(/\D/g, '');
  const national = digits.startsWith('0') ? digits.slice(1) : digits;

  // 1300/1800 service numbers group 4-3-3; mobiles (leading 4) group 3-3-3;
  // landlines carry a one-digit area code and group 4-4.
  const grouped = /^1[38]00/.test(national)
    ? [national.slice(0, 4), national.slice(4, 7), national.slice(7)]
    : national.startsWith('4')
      ? [national.slice(0, 3), national.slice(3, 6), national.slice(6)]
      : [national.slice(0, 1), national.slice(1, 5), national.slice(5)];

  return `+61 ${grouped.filter(Boolean).join(' ')}`;
}

/** Formatted one-line address for the footer and contact page. */
export function formatAddress(address: SiteSettings['address']): string {
  return [address.street, `${address.suburb} ${address.state} ${address.postcode}`].join(', ');
}

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
 * "October 2026", or null once the move date has passed. The terse form of
 * `addressNote` for surfaces with no room for the sentence — the footer.
 */
export function addressEffectiveMonth(
  settings: SiteSettings,
  now: Date = new Date(),
): string | null {
  if (!settings.address.effectiveFrom) return null;

  const effective = new Date(`${settings.address.effectiveFrom}T00:00:00Z`);
  if (Number.isNaN(effective.getTime()) || now >= effective) return null;

  return `${MONTHS[effective.getUTCMonth()]} ${effective.getUTCFullYear()}`;
}

/**
 * The qualifier that runs beside the address until the move completes, or null
 * once it has.
 *
 * Formatted by hand rather than through `toLocaleDateString`, because month
 * names from ICU differ between the build container and a developer's machine
 * and this string is baked into static HTML.
 *
 * Takes the settings rather than reading the file, so an editor who changes
 * the address in /admin moves the note with it. `now` is injectable so the
 * expiry is testable without touching the clock.
 */
export function addressNote(settings: SiteSettings, now: Date = new Date()): string | null {
  const month = addressEffectiveMonth(settings, now);
  if (!month || !settings.previousAddress) return null;

  return `Our office from ${month}. Until then we work from ${settings.previousAddress}.`;
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

const resolvedOrigin =
  normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
  // No explicit origin on Vercel: use the stable production domain in
  // production and the per-deployment host everywhere else, so preview builds
  // never advertise production URLs in their sitemap, canonicals or JSON-LD.
  normaliseOrigin(
    process.env.VERCEL_ENV === 'production'
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL,
  );

// The localhost fallback exists for development. A production build that
// reached it would ship localhost canonicals, a localhost sitemap reference
// and localhost JSON-LD on every one of ~640 URLs — silently. Fail the build
// instead: a mis-deployed environment is a one-line fix, a localhost sitemap
// in Search Console is not.
//
// Server-only, deliberately. Next inlines NODE_ENV and NEXT_PUBLIC_* into
// browser bundles but never the VERCEL_* system vars, so on a Vercel deploy
// without NEXT_PUBLIC_SITE_URL the server resolves an origin while the
// browser cannot — and this file is in the every-page client graph via the
// header's mobile menu. A module-scope throw here would pass the build, then
// crash hydration on every page. Client code only consumes `site`, so the
// browser's silent localhost fallback is unused anyway.
if (!resolvedOrigin && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  throw new Error(
    'No site origin configured. Set NEXT_PUBLIC_SITE_URL (or deploy on Vercel, ' +
      'whose system env vars provide one) — a production build must never fall ' +
      'back to http://localhost:3000.',
  );
}

export const siteUrl = resolvedOrigin ?? 'http://localhost:3000';
