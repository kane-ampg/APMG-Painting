import { describe, expect, it } from 'vitest';
import {
  REGIONS,
  isRuralFringe,
  regionInSentence,
  regionLocative,
  resolveRegion,
} from '@/lib/locations/regions';

/**
 * The region model, spec §4.2.
 *
 * 22 hubs. Every locality must land in exactly one, and the assignment has to
 * be reproducible from the data — a locality whose region depends on which
 * order the dataset happened to arrive in would move URL between builds.
 *
 * Note on `resolveRegion`'s real signature: it takes `{ council, locality,
 * state, coords }` (an extra `locality` field beyond the brief's guess) and
 * returns the full `RegionDef`, not a bare slug — so call sites below pass a
 * `locality` and assert on `.slug`.
 */

describe('REGIONS', () => {
  it('defines 22 regions', () => {
    expect(REGIONS).toHaveLength(22);
  });

  it('has unique slugs', () => {
    const slugs = REGIONS.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('splits 9 Victorian and 13 Queensland regions', () => {
    expect(REGIONS.filter((r) => r.state === 'VIC')).toHaveLength(9);
    expect(REGIONS.filter((r) => r.state === 'QLD')).toHaveLength(13);
  });

  it('marks exactly one hinterland region per state as rural fringe', () => {
    const fringe = REGIONS.filter((r) => r.ruralFringe);
    expect(fringe).toHaveLength(2);
    expect(fringe.map((r) => r.state).sort()).toEqual(['QLD', 'VIC']);
  });

  it('names no council in two regions resolveRegion could actually pick between', () => {
    // `resolveRegion` never lets a `councils` collision become an ambiguous
    // answer, because it resolves two councils by dedicated logic *before*
    // the generic `councils.includes` lookup ever runs:
    //   - a rural-fringe locality is routed to the state's hinterland region
    //     by a hardcoded slug (fringe check first), so Cardinia and Yarra
    //     Ranges legitimately also appear in the hinterland's `councils` —
    //     documentation of what feeds it, not a lookup key (spec §7.3).
    //   - 'Brisbane' is routed by bearing from the CBD (its own branch), so
    //     it legitimately appears in all five brisbane-* regions' `councils`.
    // The generic lookup also filters to `!r.ruralFringe`, so fringe
    // regions' lists are never consulted by it either way. A bare "no
    // council in two regions" check would flag both of these intentional
    // designs without catching a real bug, so this asserts the invariant
    // that actually matters: uniqueness among the non-fringe, non-Brisbane
    // regions the generic lookup can actually return.
    for (const state of ['VIC', 'QLD'] as const) {
      const seen = new Map<string, string>();
      for (const region of REGIONS.filter((r) => r.state === state && !r.ruralFringe)) {
        for (const council of region.councils) {
          if (council === 'Brisbane') continue;
          const prior = seen.get(council);
          expect(prior, `${council} appears in both ${prior} and ${region.slug}`).toBeUndefined();
          seen.set(council, region.slug);
        }
      }
    }
  });
});

describe('Brisbane City Council splits by bearing from the CBD', () => {
  const CBD = { lat: -27.4698, lng: 153.0251 };

  it.each([
    ['inner', { lat: -27.4705, lng: 153.026 }, 'brisbane-inner'],
    ['north', { lat: -27.36, lng: 153.03 }, 'brisbane-north'],
    ['east', { lat: -27.47, lng: 153.18 }, 'brisbane-east'],
    ['south', { lat: -27.58, lng: 153.03 }, 'brisbane-south'],
    ['west', { lat: -27.47, lng: 152.88 }, 'brisbane-west'],
  ])('puts a %s locality in %s', (_label, coords, expected) => {
    expect(
      resolveRegion({ council: 'Brisbane', locality: 'ANY LOCALITY', state: 'QLD', coords }).slug,
    ).toBe(expected);
  });

  it('takes the inner ring first, regardless of bearing', () => {
    // 2km due south of the CBD is inner, not brisbane-south.
    expect(
      resolveRegion({
        council: 'Brisbane',
        locality: 'ANY LOCALITY',
        state: 'QLD',
        coords: { lat: -27.488, lng: 153.0251 },
      }).slug,
    ).toBe('brisbane-inner');
    expect(CBD.lat).toBeLessThan(0);
  });
});

describe('rural fringe', () => {
  it('treats whole councils as fringe where the spec says so', () => {
    for (const council of ['Scenic Rim', 'Nillumbik', 'Murrindindi', 'Baw Baw', 'Somerset']) {
      expect(isRuralFringe(council, 'ANY LOCALITY'), council).toBe(true);
    }
  });

  it('exempts allowlisted urban localities in the two split councils', () => {
    expect(isRuralFringe('Cardinia', 'PAKENHAM')).toBe(false);
    expect(isRuralFringe('Cardinia', 'OFFICER')).toBe(false);
    expect(isRuralFringe('Yarra Ranges', 'LILYDALE')).toBe(false);
    expect(isRuralFringe('Yarra Ranges', 'CHIRNSIDE PARK')).toBe(false);
  });

  it('keeps the rest of those councils fringe', () => {
    expect(isRuralFringe('Cardinia', 'GEMBROOK')).toBe(true);
    expect(isRuralFringe('Yarra Ranges', 'POWELLTOWN')).toBe(true);
  });

  it('does not treat an ordinary metropolitan council as fringe', () => {
    expect(isRuralFringe('Maroondah', 'BAYSWATER NORTH')).toBe(false);
    expect(isRuralFringe('Brisbane', 'ACACIA RIDGE')).toBe(false);
  });
});

/**
 * How a region name reads inside a sentence.
 *
 * The region H1 was `Commercial painting in ${name}`, which produced
 * "Commercial painting in Gold Coast". The fix is per-region data rather than a
 * special case for that one string, so this asserts the reading of all 22 —
 * including the 15 that need no article, because those are the ones a
 * well-meaning edit would break by giving every region a "the".
 */
describe('region names inside a sentence', () => {
  it('gives every region a locative phrase that reads correctly', () => {
    const expected: Record<string, string> = {
      'inner-melbourne': 'in Inner Melbourne',
      'inner-east': 'in the Inner East',
      eastern: 'in Eastern Melbourne',
      'south-east': 'in South East Melbourne',
      'bayside-and-peninsula': 'across Bayside & the Peninsula',
      northern: 'in Northern Melbourne',
      'north-west': 'in North West Melbourne',
      western: 'in Western Melbourne',
      'yarra-valley-and-hinterland': 'in the Yarra Valley & Hinterland',
      'brisbane-inner': 'in Inner Brisbane',
      'brisbane-north': 'in Brisbane North',
      'brisbane-east': 'in Brisbane East',
      'brisbane-south': 'in Brisbane South',
      'brisbane-west': 'in Brisbane West',
      ipswich: 'in Ipswich',
      logan: 'in Logan',
      redlands: 'in the Redlands',
      'moreton-bay': 'in Moreton Bay',
      'sunshine-coast': 'on the Sunshine Coast',
      noosa: 'in Noosa',
      'gold-coast': 'on the Gold Coast',
      'seq-hinterland': 'in the South East Queensland Hinterland',
    };
    expect(Object.keys(expected)).toHaveLength(22);
    for (const region of REGIONS) {
      expect(regionLocative(region), region.slug).toBe(expected[region.slug]);
    }
  });

  it('reads correctly after "across", which is the other frame the hub uses', () => {
    const goldCoast = REGIONS.find((r) => r.slug === 'gold-coast');
    const ipswich = REGIONS.find((r) => r.slug === 'ipswich');
    expect(`across ${regionInSentence(goldCoast!)}`).toBe('across the Gold Coast');
    expect(`across ${regionInSentence(ipswich!)}`).toBe('across Ipswich');
  });
});
