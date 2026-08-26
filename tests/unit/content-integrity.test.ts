import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SECTOR_ICON_PATHS } from '@/components/icons/sector-icons';
import { projects } from '@/content/projects';
import { sectors } from '@/content/sectors';
import { TIER_1_OVERRIDES } from '@/content/locations.overrides';
import { services } from '@/content/services';
import { accreditations } from '@/lib/site';
import { allLocalities, hrefForVicSlug } from '@/lib/locations';

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
    ['services', services.map((s) => s.slug)],
  ])('%s have no duplicate slugs', (_name, slugs) => {
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('localities have no duplicate state|slug pairs', () => {
    // A bare slug is not unique on its own — 13 names (Brighton, Newport,
    // Windsor...) exist in both Victoria and Queensland by design. Uniqueness
    // has to be keyed on the same `state|slug` pair the locality layer itself
    // uses to resolve overrides and tiers.
    const keys = allLocalities().map((l) => `${l.state}|${l.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
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

  it('every project claiming a location resolves to a real Victorian locality', () => {
    // Inverted from the old direction: `Locality` carries no `projectSlugs`
    // of its own, so the claim now runs from the project. Every documented
    // APMG project is Victorian, and `relatedLocationSlugs` are bare,
    // un-prefixed slugs that predate the two-state dataset — 13 of them are
    // ambiguous against Queensland, so resolution has to be scoped to
    // Victoria explicitly rather than matched against a bare slug.
    for (const project of projects) {
      for (const slug of project.relatedLocationSlugs) {
        expect(
          hrefForVicSlug(slug),
          `project "${project.slug}" references location "${slug}"`,
        ).toBeDefined();
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
  it('every indexable locality is Tier 1, not rural fringe, and either hand-written or seeded', () => {
    // `Locality` has no `indexabilityReason` or `testimonial` the way the old
    // hand-written `Location` records did — "genuine unique value" is now
    // expressed structurally: Tier 1 (never Tier 3), never rural fringe, and
    // either carrying hand-written copy (`localityOverrides`) or promoted
    // onto Tier 1 by the committed seed list / override (`TIER_1_OVERRIDES`).
    for (const locality of allLocalities().filter((l) => l.indexable)) {
      expect(locality.tier, locality.href).toBe(1);
      expect(locality.ruralFringe, locality.href).toBe(false);

      const handWritten = Boolean(locality.intro) || Boolean(locality.localNotes?.length);
      const seeded = locality.tier === 1;
      expect(
        handWritten || seeded,
        `"${locality.href}" is indexable but has neither hand-written copy nor a Tier 1 seeding`,
      ).toBe(true);
    }
  });

  it('no Queensland locality is indexable while qldPresence is false', () => {
    for (const locality of allLocalities().filter((l) => l.state === 'QLD')) {
      expect(locality.indexable, locality.href).toBe(false);
    }
  });

  it('the Bayswater North override is the office suburb, not a bare seed promotion', () => {
    expect(TIER_1_OVERRIDES['VIC|bayswater-north']).toBe(true);
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
    const corpus = JSON.stringify({ projects, sectors, services, localities: allLocalities() });
    expect(corpus).not.toMatch(/throughout Australia|Australia[- ]wide|nationwide/i);
  });

  it('spells Dulux correctly wherever it appears', () => {
    const corpus = JSON.stringify({ projects, sectors, services });
    expect(corpus).not.toMatch(/deluxe/i);
  });

  it('uses one company name and never the "AMPG" transposition', () => {
    const corpus = JSON.stringify({ projects, sectors, services, localities: allLocalities() });
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

describe('card imagery', () => {
  /**
   * The service cards and the sector cards are the two grids on the homepage,
   * and each has its own way of going quietly wrong: a service photograph
   * renamed in `public/` leaves a broken card, and a sector added to
   * content/sectors.ts without a glyph leaves a card that is text where its
   * seven neighbours are not. Both fail here rather than in a screenshot.
   */
  it('every service card carries a photograph that exists in public/', () => {
    for (const service of services) {
      expect(service.image, `service "${service.slug}" has no photograph`).toBeDefined();
      const file = resolve(process.cwd(), 'public', service.image!.src.replace(/^\//, ''));
      expect(existsSync(file), `missing ${service.image!.src}`).toBe(true);
      expect(service.image!.alt.length, `alt for "${service.slug}"`).toBeGreaterThan(30);
    }
  });

  it('every project image exists in public/', () => {
    for (const project of projects) {
      for (const image of project.images) {
        const file = resolve(process.cwd(), 'public', image.src.replace(/^\//, ''));
        expect(existsSync(file), `missing ${image.src}`).toBe(true);
      }
    }
  });

  it('every sector has a glyph, and no glyph is orphaned', () => {
    const iconSlugs = Object.keys(SECTOR_ICON_PATHS).sort();
    expect(iconSlugs).toEqual(sectors.map((s) => s.slug).sort());
  });

  it('every glyph draws something on the shared 24x24 grid', () => {
    for (const [slug, paths] of Object.entries(SECTOR_ICON_PATHS)) {
      expect(paths.length, slug).toBeGreaterThan(0);
      for (const d of paths) expect(d, slug).toMatch(/^M[\d.]/);
    }
  });
});
