import { describe, expect, it } from 'vitest';
import {
  breadcrumbSchema,
  localBusinessSchema,
  organizationSchema,
  projectSchema,
} from '@/lib/schema';
import { getProject } from '@/content/projects';

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
