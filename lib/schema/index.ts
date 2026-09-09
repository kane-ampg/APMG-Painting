import { internationalPhone, site, siteUrl, verifiedAccreditations } from '@/lib/site';
import { averageRating, firstPartyReviews } from '@/content/reviews';
import type { Post, Project, Service, SiteSettings } from '@/lib/content/types';

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

/** The one PostalAddress node the business node emits. */
function postalAddress(settings: SiteSettings): JsonLdValue {
  return {
    '@type': 'PostalAddress',
    streetAddress: settings.address.street,
    addressLocality: settings.address.suburb,
    addressRegion: settings.address.state,
    postalCode: settings.address.postcode,
    addressCountry: settings.address.country,
  };
}

/**
 * The profile links, nulls dropped. Same three on both nodes, so Google is
 * pointed at one entity rather than two half-described ones.
 */
function sameAsFragment(settings: SiteSettings): string[] {
  return [settings.social.instagram, settings.social.facebook, settings.social.google].filter(
    (url): url is string => Boolean(url),
  );
}

/**
 * Where APMG works, as structured data.
 *
 * This used to enumerate every suburb with a page as a `City` node. At 7
 * locations that was merely verbose; at 1,387 it would put a megabyte of
 * near-identical nodes into the JSON-LD on every page of the site, and it
 * hardcoded `addressRegion: VIC`, which would have labelled all 804
 * Queensland suburbs Victorian.
 *
 * Stated at the level the entity actually operates at instead: a GeoCircle for
 * the Victorian radius once coordinates exist, the state, and an
 * AdministrativeArea per Queensland service region. Suburb-level coverage is
 * expressed by the pages themselves, which is what Google reads them for.
 */
function areaServedFragment(settings: SiteSettings): JsonLdValue[] {
  const circle = settings.coords
    ? [
        {
          '@type': 'GeoCircle',
          geoMidpoint: {
            '@type': 'GeoCoordinates',
            latitude: settings.coords.latitude,
            longitude: settings.coords.longitude,
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
function openingHoursFragment(settings: SiteSettings): JsonLdValue {
  if (!settings.openingHours) return {};

  return {
    openingHoursSpecification: settings.openingHours.map((entry) => ({
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
function offerCatalogFragment(services: readonly Service[]): JsonLdValue {
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

/**
 * The business, as one node.
 *
 * This used to be two top-level nodes — an Organization at `#organization`
 * and a LocalBusiness at `#localbusiness` — duplicating name, legal name,
 * address, phone and profiles with no link between them, which left Google
 * two candidate entities to reconcile. LocalBusiness is a subtype of
 * Organization, so one node carries everything, and it keeps the
 * `#organization` id because that is what serviceSchema and projectSchema
 * reference as provider/author/publisher.
 */
export function localBusinessSchema(
  services: readonly Service[],
  settings: SiteSettings,
): JsonLdValue {
  const knowsAbout = verifiedAccreditations.map((a) => a.label);

  return {
    '@context': 'https://schema.org',
    // HomeAndConstructionBusiness is the parent category; HousePainter is the
    // specific one. Emitting both keeps the broad type that other consumers
    // understand while telling Google exactly what trade this is.
    '@type': ['HomeAndConstructionBusiness', 'HousePainter'],
    '@id': `${siteUrl}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: `${siteUrl}/`,
    // The mark the header renders, so the entity Google resolves and the
    // entity a visitor sees are the same one.
    logo: `${siteUrl}${brandLogoPath}`,
    image: `${siteUrl}${brandLogoPath}`,
    foundingDate: String(site.founded),
    // Country-coded per Google's LocalBusiness guidance; prose keeps the
    // local display format. Derived from the editable display number so the
    // two cannot disagree.
    telephone: internationalPhone(settings.phone),
    email: settings.email,
    address: postalAddress(settings),
    ...(settings.coords
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: settings.coords.latitude,
            longitude: settings.coords.longitude,
          },
        }
      : {}),
    areaServed: areaServedFragment(settings),
    // The Google Business Profile is the entity link that matters most for the
    // map pack. Resolved from the review widget on the live site.
    sameAs: sameAsFragment(settings),
    // The description states the same footprint areaServed declares — it
    // used to say Melbourne only while areaServed listed three Queensland
    // regions, a contradiction inside a single node.
    description: `${site.name} is a commercial painting contractor based in ${settings.address.suburb}, serving metropolitan Melbourne and South East Queensland.`,
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
    ...offerCatalogFragment(services),
    ...openingHoursFragment(settings),
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
  /** Needed for `areaServed`, which must match the business node exactly. */
  settings: SiteSettings;
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
    areaServed: areaServedFragment(args.settings),
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

/**
 * Blog posts are published as the organisation, not as an invented personal
 * byline — APMG has no editorial staff to attribute a post to. Never carries
 * an aggregateRating: a post is not a business listing.
 */
export function blogPostingSchema(post: Post): JsonLdValue {
  const url = `${siteUrl}/blog/${post.slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: 'en-AU',
    // The business writes as itself. No invented personal bylines.
    author: { '@id': `${siteUrl}/#organization` },
    publisher: { '@id': `${siteUrl}/#organization` },
    ...(post.cover ? { image: post.cover.src } : {}),
    keywords: post.tags.join(', '),
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
