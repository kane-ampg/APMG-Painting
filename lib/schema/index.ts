import { formattedAddress, site, siteUrl, verifiedAccreditations } from '@/lib/site';
import type { Project } from '@/lib/content/types';

/**
 * JSON-LD builders.
 *
 * Rules held here deliberately:
 *  - Structured data represents visible, verified content only.
 *  - No aggregateRating is emitted. The live site displays "5.0, based on 70
 *    reviews" from a Google widget, but review markup must reflect reviews the
 *    site itself hosts and can evidence. Emitting it from a third-party widget
 *    invites a manual action.
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

export function localBusinessSchema(): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${siteUrl}/#localbusiness`,
    name: site.name,
    legalName: site.legalName,
    url: `${siteUrl}/`,
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
    areaServed: {
      '@type': 'City',
      name: 'Melbourne',
    },
    description: `${site.name} is a commercial and residential painting contractor based in ${site.address.suburb}, serving metropolitan Melbourne.`,
    // Deliberately absent: aggregateRating, review, priceRange.
    // None can currently be evidenced from first-party content.
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
    areaServed: { '@type': 'City', name: 'Melbourne' },
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
