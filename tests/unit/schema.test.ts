import { describe, expect, it } from 'vitest';
import {
  blogPostingSchema,
  breadcrumbSchema,
  localBusinessSchema,
  projectSchema,
  serviceSchema,
} from '@/lib/schema';
import { getProject } from '@/content/projects';
import { qldPresence } from '@/content/locations.overrides';
import { site, defaultSiteSettings } from '@/lib/site';
import { services } from '@/content/services';

describe('structured data', () => {
  it('never emits an aggregateRating', () => {
    // The live site shows "5.0, based on 70 reviews" from a third-party widget.
    // Review markup must describe reviews the site itself hosts and can
    // evidence, so none is emitted.
    const payloads = [localBusinessSchema(services, defaultSiteSettings)];
    for (const payload of payloads) {
      expect(JSON.stringify(payload)).not.toMatch(/aggregateRating|reviewCount|ratingValue/);
    }
  });

  it('uses the canonical phone number in country-coded form', () => {
    // Google's LocalBusiness guidance asks for a country-coded number, and
    // this must still be the canonical business line — never a CallRail
    // tracking number.
    expect(localBusinessSchema(services, defaultSiteSettings).telephone).toBe('+61 1300 979 740');
  });

  it('is one entity, not two: a single node carrying the #organization id', () => {
    // Organization and LocalBusiness used to ship as two separate top-level
    // nodes describing the same business with no link between them, leaving
    // Google to reconcile two candidate entities. One node, one @id — and the
    // Organization-only facts (foundingDate, knowsAbout) ride along on it.
    const schema = localBusinessSchema(services, defaultSiteSettings);
    expect(schema['@id']).toMatch(/#organization$/);
    expect(schema.foundingDate).toBe(String(site.founded));
    expect(Array.isArray(schema.knowsAbout)).toBe(true);
  });

  it('states one legal entity name', () => {
    expect(localBusinessSchema(services, defaultSiteSettings).legalName).toBe(
      'APMG Painting Services Pty Ltd',
    );
  });

  it('reflects the settings it is given, not the file', () => {
    const changed = {
      ...defaultSiteSettings,
      phone: '1300 00 00 00',
      email: 'hello@apmgpainting.com.au',
    };
    const data = localBusinessSchema(services, changed);
    expect(data.telephone).toBe('+61 1300 000 000');
    expect(data.email).toBe('hello@apmgpainting.com.au');
  });

  it('carries the brand names from the 2025 brand guide as alternate names', () => {
    // The guide brands the group as "APMG Services" and expands the acronym in
    // the logo descriptor. Both are names the entity is known by; neither
    // replaces the trading name this site uses.
    const schema = localBusinessSchema(services, defaultSiteSettings);
    expect(schema.name).toBe('APMG Painting');
    expect(schema.alternateName).toEqual([
      'APMG Services',
      'Australian Property Maintenance Group',
    ]);
  });

  it('describes the business in brand-guide terms without residential claims', () => {
    const schema = localBusinessSchema(services, defaultSiteSettings);
    expect(String(schema.description)).toMatch(/Melbourne-based, Australian-owned/);
    expect(String(schema.description)).toMatch(/2015/);
    expect(String(schema.slogan)).toBe('Australian Property Maintenance Group');
    expect(JSON.stringify(schema)).not.toMatch(/residential|homeowner/i);
  });
  it('scopes the service area to Melbourne', () => {
    expect(JSON.stringify(localBusinessSchema(services, defaultSiteSettings))).toContain(
      'Melbourne',
    );
    expect(JSON.stringify(localBusinessSchema(services, defaultSiteSettings))).not.toMatch(
      /Australia[- ]wide|nationwide/i,
    );
  });

  it('declares the specific trade, not just the parent category', () => {
    // "HomeAndConstructionBusiness" also covers plumbers and roofers. The
    // painting-specific type is what makes the entity unambiguous.
    expect(localBusinessSchema(services, defaultSiteSettings)['@type']).toContain('HousePainter');
  });

  it('omits geo and hours until they are confirmed', () => {
    // Both are high-value local signals, which is exactly why a guessed value
    // is dangerous: a wrong latitude moves the business, and invented hours
    // tell people to call an empty office. Structure ships now, values ship
    // when APMG supplies them.
    const schema = localBusinessSchema(services, defaultSiteSettings);

    expect(defaultSiteSettings.coords).toBeNull();
    expect(defaultSiteSettings.openingHours).toBeNull();

    expect(schema.geo).toBeUndefined();
    expect(schema.openingHoursSpecification).toBeUndefined();
    expect(JSON.stringify(schema.areaServed)).not.toContain('GeoCircle');
    expect(schema.sameAs).not.toContain(null);
  });

  it('links the Google Business Profile through sameAs', () => {
    // The single largest map-pack signal the site can emit: it is how Google is
    // told that this entity and that profile are the same business. Resolved
    // from the review widget on apmgpainting.com.au, so it is APMG's own
    // profile rather than a guessed one.
    const schema = localBusinessSchema(services, defaultSiteSettings);

    expect(defaultSiteSettings.social.google).toContain('place_id:');
    expect(schema.sameAs).toContain(defaultSiteSettings.social.google);
  });

  it('offers the same service area on a service as on the business', () => {
    // A service page claiming a narrower area than the business is a
    // contradiction, and Google resolves it against you.
    const service = serviceSchema({
      name: 'Interior painting',
      description: 'Interior work in occupied spaces.',
      path: '/commercial/',
      settings: defaultSiteSettings,
    });
    expect(JSON.stringify(service.areaServed)).toEqual(
      JSON.stringify(localBusinessSchema(services, defaultSiteSettings).areaServed),
    );
  });

  it('numbers breadcrumb positions from one, in order', () => {
    const schema = breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Commercial painting', path: '/commercial/' },
      { name: 'Healthcare', path: '/healthcare-painters/' },
    ]);
    const items = schema.itemListElement as { position: number; name: string }[];
    expect(items.map((i) => i.position)).toEqual([1, 2, 3]);
    expect(items[2]?.name).toBe('Healthcare');
  });

  it('describes a project using only its own recorded facts', () => {
    const project = getProject('emmaus-college-school-repaint-vermont');
    expect(project).toBeDefined();
    if (!project) return;

    const schema = projectSchema(project);
    expect(schema.headline).toBe(project.title);
    expect(JSON.stringify(schema.contentLocation)).toContain('Vermont');
  });
});

describe('areaServed after the VIC + QLD expansion', () => {
  const business = localBusinessSchema(services, defaultSiteSettings) as Record<string, unknown>;
  const areas = business.areaServed as Record<string, unknown>[];

  it('does not enumerate 1,387 suburbs into sitewide JSON-LD', () => {
    expect(areas.length).toBeLessThan(20);
  });

  it('names Victoria and the three Queensland service regions', () => {
    const names = areas.map((a) => a.name).filter(Boolean);
    expect(names).toContain('Victoria');
    expect(names).toContain('Brisbane');
    expect(names).toContain('Gold Coast');
    expect(names).toContain('Sunshine Coast');
  });

  it('never labels a Queensland area as Victorian', () => {
    const json = JSON.stringify(areas);
    expect(json).not.toMatch(/"addressRegion":"VIC"[^}]*(Brisbane|Gold Coast|Sunshine)/);
  });

  it('emits exactly one LocalBusiness while qldPresence is false', () => {
    // The brief's literal snippet checks `business['@type']).toBe('LocalBusiness')`,
    // but `@type` here is `['HomeAndConstructionBusiness', 'HousePainter']` —
    // that assignment sits outside the areaServedFragment lines this task
    // scopes for lib/schema/index.ts, and changing it would drop the
    // painting-specific type the "declares the specific trade" test above
    // guards. Both types resolve to LocalBusiness in schema.org's hierarchy;
    // asserted here as "still a LocalBusiness-family type" instead.
    expect(qldPresence).toBe(false);
    expect(business['@type']).toContain('HousePainter');
  });

  it('omits GeoCircle until APMG confirms the base coordinates', () => {
    expect(site.coords).toBeNull();
    expect(areas.some((a) => a['@type'] === 'GeoCircle')).toBe(false);
  });
});

describe('blog posting schema', () => {
  const post = {
    slug: 'sequencing-an-occupied-office',
    title: 'Sequencing a repaint in an occupied office',
    excerpt: 'How zones are handed back.',
    body: '# Heading\n\nText.',
    publishedAt: '2026-09-01',
    updatedAt: '2026-09-08',
    author: 'APMG Painting',
    tags: ['office'],
    metaTitle: 'Sequencing an occupied office repaint | APMG Painting',
    metaDescription: 'How zones are handed back.',
  };

  it('is a BlogPosting authored by the organisation with both dates', () => {
    const data = blogPostingSchema(post);
    expect(data['@type']).toBe('BlogPosting');
    expect(data.datePublished).toBe('2026-09-01');
    expect(data.dateModified).toBe('2026-09-08');
    expect(JSON.stringify(data.author)).toContain('#organization');
    expect(String(data.url)).toMatch(/\/blog\/sequencing-an-occupied-office\/$/);
  });

  it('never emits an aggregateRating', () => {
    expect(JSON.stringify(blogPostingSchema(post))).not.toMatch(/aggregateRating/);
  });
});
