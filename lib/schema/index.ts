import { formattedAddress, site, siteUrl, verifiedAccreditations } from '@/lib/site';
import { averageRating, firstPartyReviews } from '@/content/reviews';
import { services } from '@/content/services';
import type { Project } from '@/lib/content/types';

/** The APMG mark, dark-on-transparent — the header variant. */
export const brandLogoPath = '/images/brand/apmg-logo-ink.webp';

/**
 * JSON-LD builders.
 *
 * Rules held here deliberately:
 *  - Structured data represents visible, verified content only.
 *  - aggregateRating is emitted ONLY from verified FIRST-PARTY reviews in
 *    content/reviews.ts, which currently holds none. The seven Google reviews
 *    in that file render on the page with attribution but are excluded here:
 *    review markup must reflect reviews the site itself collected, and marking
 *    up reviews read back off a Google profile is a well-worn route to a manual
 *    action. Add a first-party review and this lights up on its own.
 *  - No telephone is emitted from CallRail's dynamic number insertion — only
 *    the canonical business number.
 *  - Accreditations appear only once verified.
 */

type JsonLdValue = Record<string, unknown>;

export function organizationSchema(): JsonLdValue {
  const knowsAbout = verifiedAccreditations.map((a) => a.label);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: `${siteUrl}/`,
    // The mark the header renders, so the entity Google resolves and the
    // entity a visitor sees are the same one.
    logo: `${siteUrl}${brandLogoPath}`,
    foundingDate: String(site.founded),
    email: site.email,
    telephone: site.phone.display,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.suburb,
      addressRegion: site.address.state,
      postalCode: site.address.postcode,
      addressCountry: site.address.country,
    },
    // Same three profiles as the LocalBusiness node, so both nodes point Google
    // at one entity rather than two half-described ones.
    sameAs: [site.social.instagram, site.social.facebook, site.social.google].filter(Boolean),
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
  };
}

/**
 * Where APMG works, as structured data.
 *
 * This used to enumerate every suburb with a page as a `City` node. At 7
 * locations that was merely verbose; at 1,440 it would put a megabyte of
 * near-identical nodes into the JSON-LD on every page of the site, and it
 * hardcoded `addressRegion: VIC`, which would have labelled all 828
 * Queensland suburbs Victorian.
 *
 * Stated at the level the entity actually operates at instead: a GeoCircle for
 * the Victorian radius once coordinates exist, the state, and an
 * AdministrativeArea per Queensland service region. Suburb-level coverage is
 * expressed by the pages themselves, which is what Google reads them for.
 */
function areaServedFragment(): JsonLdValue[] {
  const circle = site.coords
    ? [
        {
          '@type': 'GeoCircle',
          geoMidpoint: {
            '@type': 'GeoCoordinates',
            latitude: site.coords.latitude,
            longitude: site.coords.longitude,
          },
          geoRadius: site.serviceArea.radiusKm * 1000,
        },
      ]
    : [];

  return [
    ...circle,
    { '@type': 'State', name: 'Victoria' },
    { '@type': 'City', name: 'Melbourne' },
    // Queensland is areaServed and nothing more — no address, no projects, no
    // second LocalBusiness entity (spec §9).
    { '@type': 'AdministrativeArea', name: 'Brisbane' },
    { '@type': 'AdministrativeArea', name: 'Gold Coast' },
    { '@type': 'AdministrativeArea', name: 'Sunshine Coast' },
  ];
}

/** Opening hours, only once APMG has confirmed them. */
function openingHoursFragment(): JsonLdValue {
  if (!site.openingHours) return {};

  return {
    openingHoursSpecification: site.openingHours.map((entry) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: entry.days,
      opens: entry.opens,
      closes: entry.closes,
    })),
  };
}

/**
 * The five services as an offer catalogue.
 *
 * This is what lets a search engine — or an answer engine — enumerate what
 * APMG actually does without parsing prose out of the page.
 */
function offerCatalogFragment(): JsonLdValue {
  return {
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Painting services',
      // No `url` per service: the five services are sections of the homepage
      // grid, not pages, and there is no `#interior-painting` anchor to point
      // at. A structured-data URL that 404s to a fragment is worse than none.
      itemListElement: services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.title,
          description: service.summary,
        },
      })),
    },
  };
}

export function localBusinessSchema(): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    // HomeAndConstructionBusiness is the parent category; HousePainter is the
    // specific one. Emitting both keeps the broad type that other consumers
    // understand while telling Google exactly what trade this is.
    '@type': ['HomeAndConstructionBusiness', 'HousePainter'],
    '@id': `${siteUrl}/#localbusiness`,
    name: site.name,
    legalName: site.legalName,
    url: `${siteUrl}/`,
    logo: `${siteUrl}${brandLogoPath}`,
    image: `${siteUrl}${brandLogoPath}`,
    telephone: site.phone.display,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.suburb,
      addressRegion: site.address.state,
      postalCode: site.address.postcode,
      addressCountry: site.address.country,
    },
    ...(site.coords
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: site.coords.latitude,
            longitude: site.coords.longitude,
          },
        }
      : {}),
    areaServed: areaServedFragment(),
    // The Google Business Profile is the entity link that matters most for the
    // map pack. Resolved from the review widget on the live site.
    sameAs: [site.social.instagram, site.social.facebook, site.social.google].filter(Boolean),
    description: `${site.name} is a commercial painting contractor based in ${site.address.suburb}, serving metropolitan Melbourne.`,
    ...offerCatalogFragment(),
    ...openingHoursFragment(),
    // Spreads to nothing while content/reviews.ts holds no first-party entries.
    // priceRange stays absent until APMG supplies a defensible band.
    ...aggregateRatingFragment(),
  };
}

/**
 * The aggregateRating + review block, derived from verified first-party
 * reviews only. Returns an empty object when there are none, so the spread
 * above is a no-op rather than a zero-star business.
 *
 * The average and the count are computed, never typed. A hand-written
 * aggregate that disagrees with the reviews under it is exactly what earns a
 * structured-data manual action.
 */
function aggregateRatingFragment(): JsonLdValue {
  const average = averageRating();
  if (average === null) return {};

  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: average,
      reviewCount: firstPartyReviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: firstPartyReviews.map((entry) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: entry.rating, bestRating: 5, worstRating: 1 },
      author: { '@type': 'Person', name: entry.attribution },
      ...(entry.date ? { datePublished: entry.date } : {}),
      reviewBody: entry.quote,
    })),
  };
}

export function breadcrumbSchema(crumbs: readonly { name: string; path: string }[]): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };
}

export function serviceSchema(args: {
  name: string;
  description: string;
  path: string;
}): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: args.name,
    description: args.description,
    serviceType: args.name,
    provider: { '@id': `${siteUrl}/#organization` },
    // Same three-level area as the business itself. A service page that claims
    // a narrower area than the business does is a contradiction Google has to
    // resolve, and it resolves it against you.
    areaServed: areaServedFragment(),
    url: `${siteUrl}${args.path}`,
  };
}

/**
 * Case studies are published as Article. CreativeWork would also be defensible,
 * but Article matches how they read and how they are linked.
 */
export function projectSchema(project: Project): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: project.title,
    description: project.challenge,
    author: { '@id': `${siteUrl}/#organization` },
    publisher: { '@id': `${siteUrl}/#organization` },
    url: `${siteUrl}/projects/${project.slug}/`,
    image: project.images.map((image) => `${siteUrl}${image.src}`),
    contentLocation: {
      '@type': 'Place',
      name: project.location,
    },
  };
}

export function faqSchema(items: readonly { question: string; answer: string }[]): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** Address string reused by components that display rather than mark up. */
export { formattedAddress };
