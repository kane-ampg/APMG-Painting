import { formattedAddress, site, siteUrl, verifiedAccreditations } from '@/lib/site';
import { averageRating, verifiedReviews } from '@/content/reviews';
import { locations } from '@/content/locations';
import { services } from '@/content/services';
import type { Project } from '@/lib/content/types';

/** The APMG mark, dark-on-transparent — the header variant. */
export const brandLogoPath = '/images/brand/apmg-logo-ink.webp';

/**
 * JSON-LD builders.
 *
 * Rules held here deliberately:
 *  - Structured data represents visible, verified content only.
 *  - aggregateRating is emitted ONLY from verified first-party reviews in
 *    content/reviews.ts, which is currently empty. The live site displays
 *    "5.0, based on 70 reviews" from a Google widget; review markup must
 *    reflect reviews the site itself hosts and can evidence, so nothing is
 *    emitted from that widget. Populate reviews.ts and this lights up on its
 *    own.
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
    sameAs: [site.social.instagram, site.social.facebook],
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
  };
}

/**
 * Where APMG works, as structured data.
 *
 * A single `City: Melbourne` node — which is what this used to emit — tells
 * Google the business serves one place. APMG is a service-area business
 * covering a 60km radius, and the suburb-level queries ("painters Brighton")
 * are the ones a local trade actually wins. So the area is stated three ways,
 * from narrowest to broadest, all of it derived from data already in the repo:
 * every suburb with a page, the metro area, and the state.
 *
 * The `GeoCircle` is the form Google most directly associates with a
 * service-area business, and it appears only once APMG confirms the base
 * coordinates. See the note on `site.coords`.
 */
function areaServedFragment(): JsonLdValue[] {
  const suburbs = locations.map((location) => ({
    '@type': 'City',
    name: location.suburb,
    address: {
      '@type': 'PostalAddress',
      addressLocality: location.suburb,
      addressRegion: site.address.state,
      addressCountry: site.address.country,
    },
  }));

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
    { '@type': 'City', name: 'Melbourne' },
    { '@type': 'State', name: 'Victoria' },
    ...suburbs,
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
    // map pack, and it is absent until APMG supplies it.
    sameAs: [site.social.instagram, site.social.facebook, site.social.google].filter(Boolean),
    description: `${site.name} is a commercial and residential painting contractor based in ${site.address.suburb}, serving metropolitan Melbourne.`,
    ...offerCatalogFragment(),
    ...openingHoursFragment(),
    // Spreads to nothing while content/reviews.ts holds no verified entries.
    // priceRange stays absent until APMG supplies a defensible band.
    ...aggregateRatingFragment(),
  };
}

/**
 * The aggregateRating + review block, derived from verified first-party
 * reviews. Returns an empty object when there are none, so the spread above is
 * a no-op rather than a zero-star business.
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
      reviewCount: verifiedReviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: verifiedReviews.map((entry) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: entry.rating, bestRating: 5, worstRating: 1 },
      author: { '@type': 'Person', name: entry.attribution },
      datePublished: entry.date,
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
