import { describe, expect, it } from 'vitest';
import { projects } from '@/content/projects';
import { sectors } from '@/content/sectors';
import { locations } from '@/content/locations';
import { services } from '@/content/services';
import { accreditations } from '@/lib/site';

/**
 * Content integrity.
 *
 * These guard the specific defects found on the live WordPress site, so a
 * regression fails the build rather than shipping.
 */

describe('slug uniqueness', () => {
  it.each([
    ['projects', projects.map((p) => p.slug)],
    ['sectors', sectors.map((s) => s.slug)],
    ['locations', locations.map((l) => l.slug)],
    ['services', services.map((s) => s.slug)],
  ])('%s have no duplicate slugs', (_name, slugs) => {
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('sector URLs are unique — no two pages claim the same path', () => {
    const paths = sectors.map((s) => s.legacyPath);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('referential integrity', () => {
  it('every project a sector claims actually exists', () => {
    const known = new Set(projects.map((p) => p.slug));
    for (const sector of sectors) {
      for (const slug of sector.projectSlugs) {
        expect(known, `sector "${sector.slug}" references "${slug}"`).toContain(slug);
      }
    }
  });

  it('every project a location claims actually exists', () => {
    const known = new Set(projects.map((p) => p.slug));
    for (const location of locations) {
      for (const slug of location.projectSlugs) {
        expect(known, `location "${location.slug}" references "${slug}"`).toContain(slug);
      }
    }
  });

  it('every related service on a project exists', () => {
    const known = new Set(services.map((s) => s.slug));
    for (const project of projects) {
      for (const slug of project.relatedServiceSlugs) {
        expect(known, `project "${project.slug}" references service "${slug}"`).toContain(slug);
      }
    }
  });
});

describe('location indexability rules', () => {
  it('a location is only indexable when it has genuine unique value', () => {
    for (const location of locations.filter((l) => l.indexable)) {
      const hasEvidence =
        location.projectSlugs.length > 0 ||
        Boolean(location.testimonial) ||
        Boolean(location.localNotes?.length);

      expect(
        hasEvidence,
        `"${location.slug}" is indexable but carries no project, testimonial or local detail`,
      ).toBe(true);
    }
  });

  it('every location records why it is or is not indexable', () => {
    for (const location of locations) {
      expect(location.indexabilityReason.length).toBeGreaterThan(20);
    }
  });

  it('no location slug repeats the word "painters" twice', () => {
    // Guards the "Painters Painters Armadale" class of defect.
    for (const location of locations) {
      const occurrences = location.slug.match(/painters/g) ?? [];
      expect(occurrences.length, `"${location.slug}"`).toBeLessThanOrEqual(1);
    }
  });

  it('no suburb name contains a service word', () => {
    // Guards H1s like "Painting Brighton" and "Painters Travencore".
    for (const location of locations) {
      expect(location.suburb, `"${location.slug}"`).not.toMatch(/paint/i);
    }
  });
});

describe('claim safety', () => {
  it('no accreditation is presented as verified without a certificate flag', () => {
    for (const item of accreditations) {
      expect(typeof item.verified).toBe('boolean');
    }
  });

  it('no content claims nationwide coverage', () => {
    // The live /commercial/ page says "throughout Australia". Every project
    // APMG can evidence is Victorian.
    const corpus = JSON.stringify({ projects, sectors, services, locations });
    expect(corpus).not.toMatch(/throughout Australia|Australia[- ]wide|nationwide/i);
  });

  it('spells Dulux correctly wherever it appears', () => {
    const corpus = JSON.stringify({ projects, sectors, services });
    expect(corpus).not.toMatch(/deluxe/i);
  });

  it('uses one company name and never the "AMPG" transposition', () => {
    const corpus = JSON.stringify({ projects, sectors, services, locations });
    expect(corpus).not.toMatch(/AMPG/);
    expect(corpus).not.toMatch(/APMG Services/);
  });
});

describe('featured project quality gate', () => {
  it('featured projects document scope, access and outcome', () => {
    for (const project of projects.filter((p) => p.isFeatured)) {
      expect(project.scopeOfWork.length, project.slug).toBeGreaterThan(0);
      expect(project.outcome.length, project.slug).toBeGreaterThan(0);
      expect(project.accessAndSafety?.length ?? 0, project.slug).toBeGreaterThan(0);
    }
  });
});
