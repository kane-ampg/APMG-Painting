import { describe, expect, it } from 'vitest';
import {
  breadcrumbSchema,
  localBusinessSchema,
  organizationSchema,
  projectSchema,
  serviceSchema,
} from '@/lib/schema';
import { getProject } from '@/content/projects';
import { qldPresence } from '@/content/locations.overrides';
import { site } from '@/lib/site';

describe('structured data', () => {
  it('never emits an aggregateRating', () => {
    // The live site shows "5.0, based on 70 reviews" from a third-party widget.
    // Review markup must describe reviews the site itself hosts and can
    // evidence, so none is emitted.
    const payloads = [organizationSchema(), localBusinessSchema()];
    for (const payload of payloads) {
      expect(JSON.stringify(payload)).not.toMatch(/aggregateRating|reviewCount|ratingValue/);
    }
  });

  it('uses the canonical phone number, not a CallRail tracking number', () => {
    expect(localBusinessSchema().telephone).toBe('1300 97 97 40');
  });

  it('states one legal entity name', () => {
    expect(organizationSchema().legalName).toBe('APMG Painting Services Pty Ltd');
  });

  it('scopes the service area to Melbourne', () => {
    expect(JSON.stringify(localBusinessSchema())).toContain('Melbourne');
    expect(JSON.stringify(localBusinessSchema())).not.toMatch(/Australia[- ]wide|nationwide/i);
  });

  it('declares the specific trade, not just the parent category', () => {
    // "HomeAndConstructionBusiness" also covers plumbers and roofers. The
    // painting-specific type is what makes the entity unambiguous.
    expect(localBusinessSchema()['@type']).toContain('HousePainter');
  });

  it('omits geo and hours until they are confirmed', () => {
    // Both are high-value local signals, which is exactly why a guessed value
    // is dangerous: a wrong latitude moves the business, and invented hours
    // tell people to call an empty office. Structure ships now, values ship
    // when APMG supplies them.
    const schema = localBusinessSchema();

    expect(site.coords).toBeNull();
    expect(site.openingHours).toBeNull();

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
    const schema = localBusinessSchema();

    expect(site.social.google).toContain('place_id:');
    expect(schema.sameAs).toContain(site.social.google);
  });

  it('offers the same service area on a service as on the business', () => {
    // A service page claiming a narrower area than the business is a
    // contradiction, and Google resolves it against you.
    const service = serviceSchema({
      name: 'Interior painting',
      description: 'Interior work in occupied spaces.',
      path: '/commercial/',
    });
    expect(JSON.stringify(service.areaServed)).toEqual(
      JSON.stringify(localBusinessSchema().areaServed),
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
  const business = localBusinessSchema() as Record<string, unknown>;
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
