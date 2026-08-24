import { describe, expect, it } from 'vitest';
import {
  breadcrumbSchema,
  localBusinessSchema,
  organizationSchema,
  projectSchema,
  serviceSchema,
} from '@/lib/schema';
import { getProject } from '@/content/projects';
import { locations } from '@/content/locations';
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

  it('names every suburb it publishes a page for in areaServed', () => {
    const served = JSON.stringify(localBusinessSchema().areaServed);
    // "painters <suburb>" is the query a local trade can actually win, so
    // each suburb has to appear as its own served area rather than being
    // flattened into a single "Melbourne" node.
    for (const location of locations) {
      expect(served).toContain(location.suburb);
    }
    expect(served).toContain('Victoria');
  });

  it('omits geo, hours and Google Business Profile until they are confirmed', () => {
    // These three are the highest-value local signals on the site, which is
    // exactly why a guessed value is dangerous: a wrong latitude moves the
    // business, invented hours tell people to call an empty office, and a
    // wrong sameAs claims an entity APMG does not own. Structure ships now,
    // values ship when APMG supplies them.
    const schema = localBusinessSchema();

    expect(site.coords).toBeNull();
    expect(site.openingHours).toBeNull();
    expect(site.social.google).toBeNull();

    expect(schema.geo).toBeUndefined();
    expect(schema.openingHoursSpecification).toBeUndefined();
    expect(JSON.stringify(schema.areaServed)).not.toContain('GeoCircle');
    expect(schema.sameAs).not.toContain(null);
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
