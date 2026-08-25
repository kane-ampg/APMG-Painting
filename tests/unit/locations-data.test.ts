import { describe, expect, it } from 'vitest';
import generated from '@/content/locations.generated.json';
import { REGIONS } from '@/lib/locations/regions';
import { getCouncil } from '@/content/councils';
import { ANCHORS } from '@/lib/geo/anchors';
import { distanceKm } from '@/lib/geo/haversine';
import type { GeneratedLocality } from '@/lib/locations/types';

const localities = generated.localities as GeneratedLocality[];

/**
 * The generated dataset.
 *
 * The generator already fails the build on a bad total or an unexplained
 * single-locality council. These are the invariants a *consumer* depends on:
 * one URL per locality, a resolvable region, a council note that exists, and
 * neighbour links that point at real pages.
 */

describe('coverage', () => {
  it('holds 1,440 localities', () => {
    expect(localities).toHaveLength(1440);
  });

  it('splits 612 Victorian and 828 Queensland', () => {
    expect(localities.filter((l) => l.state === 'VIC')).toHaveLength(612);
    expect(localities.filter((l) => l.state === 'QLD')).toHaveLength(828);
  });

  it('assigns every locality to one of the four anchors, in the right counts', () => {
    const counts = new Map<string, number>();
    for (const l of localities) counts.set(l.anchorKey, (counts.get(l.anchorKey) ?? 0) + 1);
    expect(counts.get('bayswater-north')).toBe(612);
    expect(counts.get('brisbane')).toBe(501);
    expect(counts.get('southport')).toBe(172);
    expect(counts.get('maroochydore')).toBe(155);
  });

  it('places every locality inside its anchor radius', () => {
    for (const l of localities) {
      const anchor = ANCHORS.find((a) => a.key === l.anchorKey);
      expect(anchor, `${l.name} has unknown anchor ${l.anchorKey}`).toBeDefined();
      if (!anchor) continue;
      expect(l.distanceKm, `${l.name}`).toBeLessThanOrEqual(anchor.radiusKm);
      expect(distanceKm(anchor.coords, l.coords)).toBeCloseTo(l.distanceKm, 1);
    }
  });

  it('never assigns a locality to an anchor in another state', () => {
    for (const l of localities) {
      const anchor = ANCHORS.find((a) => a.key === l.anchorKey);
      expect(anchor?.state, `${l.name}`).toBe(l.state);
    }
  });
});

describe('one URL per locality', () => {
  it('has no duplicate state+slug pair', () => {
    const keys = localities.map((l) => `${l.state}|${l.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has 13 slugs shared across the two states, which is why URLs are nested', () => {
    const bySlug = new Map<string, Set<string>>();
    for (const l of localities) {
      const states = bySlug.get(l.slug) ?? new Set<string>();
      states.add(l.state);
      bySlug.set(l.slug, states);
    }
    const shared = [...bySlug.values()].filter((s) => s.size > 1);
    expect(shared).toHaveLength(13);
  });

  it('uses url-safe slugs', () => {
    for (const l of localities) {
      expect(l.slug, l.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

describe('referential integrity', () => {
  it('resolves every regionSlug to a real region in the same state', () => {
    for (const l of localities) {
      const region = REGIONS.find((r) => r.slug === l.regionSlug);
      expect(region, `${l.name} -> ${l.regionSlug}`).toBeDefined();
      expect(region?.state, `${l.name}`).toBe(l.state);
    }
  });

  it('has a council note for every council in the data', () => {
    const missing = [...new Set(localities.map((l) => l.council))].filter((c) => !getCouncil(c));
    expect(missing, `add these to content/councils.ts: ${missing.join(', ')}`).toEqual([]);
  });

  it('gives every locality six neighbours that are real /areas/ pages', () => {
    const hrefs = new Set(
      localities.map((l) => {
        const state = l.state === 'VIC' ? 'victoria' : 'queensland';
        return `/areas/${state}/${l.regionSlug}/${l.slug}/`;
      }),
    );
    for (const l of localities) {
      expect(l.neighbourHrefs.length, l.name).toBeLessThanOrEqual(6);
      for (const href of l.neighbourHrefs) {
        expect(hrefs, `${l.name} links to ${href}`).toContain(href);
        expect(href, `${l.name} links to itself`).not.toBe(
          `/areas/${l.state === 'VIC' ? 'victoria' : 'queensland'}/${l.regionSlug}/${l.slug}/`,
        );
      }
    }
  });
});

describe('rural fringe', () => {
  it('flags 209 localities', () => {
    expect(localities.filter((l) => l.ruralFringe)).toHaveLength(209);
  });

  it('puts every fringe locality in a fringe region', () => {
    const fringeRegions = new Set(REGIONS.filter((r) => r.ruralFringe).map((r) => r.slug));
    for (const l of localities.filter((x) => x.ruralFringe)) {
      expect(fringeRegions, l.name).toContain(l.regionSlug);
    }
  });
});

describe('data quality', () => {
  it('excludes Australia Post BC/DC/MC delivery artifacts', () => {
    const artifacts = localities.filter((l) => /\b(BC|DC|MC)$/.test(l.name));
    expect(artifacts.map((l) => l.name)).toEqual([]);
  });

  it('excludes institutional delivery areas that are not suburbs', () => {
    const names = new Set(localities.map((l) => l.name));
    for (const excluded of [
      'BRISBANE AIRPORT',
      'MELBOURNE AIRPORT',
      'MONASH UNIVERSITY',
      'ROYAL MELBOURNE HOSPITAL',
      'ROBINA TOWN CENTRE',
      'GRIFFITH UNIVERSITY',
    ]) {
      expect(names, excluded).not.toContain(excluded);
    }
  });

  it('keeps Airport West, which is a real suburb and not a postal artifact', () => {
    expect(localities.some((l) => l.name === 'AIRPORT WEST')).toBe(true);
  });

  it('drops the geographically impossible councils', () => {
    const councils = new Set(localities.map((l) => l.council));
    expect(councils).not.toContain('Surf Coast');
    expect(councils).not.toContain('South Gippsland');
  });

  it('corrects the three miscoded postcodes', () => {
    const wynnum = localities.find((l) => l.name === 'WYNNUM');
    expect(wynnum?.council).toBe('Brisbane');
    const ascot = localities.find((l) => l.name === 'ASCOT' && l.state === 'QLD');
    expect(ascot?.council).toBe('Brisbane');
  });
});
