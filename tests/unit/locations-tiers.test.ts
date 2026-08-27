import { describe, expect, it } from 'vitest';
import {
  allLocalities,
  displayName,
  getLocality,
  getLocalityByHref,
  indexableLocalities,
  localitiesInRegion,
  regionsInState,
  stateFromSlug,
  stateSlug,
} from '@/lib/locations';
import { qldPresence } from '@/content/locations.overrides';

/**
 * Tiers and indexability — the mechanism that makes 1,387 pages safe.
 *
 * 17 indexable pages, not 1,387. If this count moves, someone has changed the
 * risk profile of the whole site and should have to say so in a diff.
 *
 * 2026-08-27: 16 -> 17. Brighton VIC promoted to Tier 1: it carries
 * hand-written copy and the documented Newbay Medical project — the exact
 * evidence bar the tiering exists to enforce.
 */

describe('indexability', () => {
  it('makes exactly 17 suburbs indexable', () => {
    expect(indexableLocalities()).toHaveLength(17);
  });

  it('includes Bayswater North, which is APMG’s own office', () => {
    const slugs = indexableLocalities().map((l) => `${l.state}|${l.slug}`);
    expect(slugs).toContain('VIC|bayswater-north');
  });

  it('includes Brighton, which carries a documented project and hand-written copy', () => {
    const slugs = indexableLocalities().map((l) => `${l.state}|${l.slug}`);
    expect(slugs).toContain('VIC|brighton');
  });

  it('indexes no Queensland locality while qldPresence is false', () => {
    expect(qldPresence).toBe(false);
    expect(indexableLocalities().filter((l) => l.state === 'QLD')).toEqual([]);
  });

  it('indexes no rural-fringe locality', () => {
    expect(indexableLocalities().filter((l) => l.ruralFringe)).toEqual([]);
  });

  it('marks every other locality noindex', () => {
    expect(allLocalities().filter((l) => !l.indexable)).toHaveLength(1370);
  });

  it('never marks a Tier 3 locality indexable', () => {
    for (const l of allLocalities()) {
      if (l.tier === 3) expect(l.indexable, l.name).toBe(false);
    }
  });
});

describe('hrefs', () => {
  it('nests under /areas/ with a trailing slash', () => {
    for (const l of allLocalities()) {
      expect(l.href, l.name).toMatch(/^\/areas\/(victoria|queensland)\/[a-z0-9-]+\/[a-z0-9-]+\/$/);
    }
  });

  it('never emits a /locations/ href', () => {
    expect(allLocalities().filter((l) => l.href.startsWith('/locations/'))).toEqual([]);
  });

  it('gives 1,387 unique hrefs', () => {
    const hrefs = allLocalities().map((l) => l.href);
    expect(new Set(hrefs).size).toBe(1387);
  });

  it('round-trips through getLocalityByHref', () => {
    for (const l of allLocalities()) {
      expect(getLocalityByHref(l.href)?.slug, l.href).toBe(l.slug);
    }
  });

  it('resolves the two same-named suburbs to different states', () => {
    const vic = getLocality('victoria', 'bayside-and-peninsula', 'brighton');
    const qld = getLocality('queensland', 'brisbane-north', 'brighton');
    expect(vic?.state).toBe('VIC');
    expect(qld?.state).toBe('QLD');
    expect(vic?.href).not.toBe(qld?.href);
  });

  it('returns undefined for a state/region/suburb combination that does not exist', () => {
    expect(getLocality('victoria', 'gold-coast', 'molendinar')).toBeUndefined();
    expect(getLocality('queensland', 'eastern', 'vermont')).toBeUndefined();
  });
});

describe('hand-written copy survives the migration', () => {
  it('keeps the Vermont intro from the outgoing content/locations.ts', () => {
    const vermont = getLocality('victoria', 'eastern', 'vermont');
    expect(vermont?.intro).toContain('Emmaus College');
    expect(vermont?.localNotes?.length).toBe(2);
  });

  it('keeps the Brighton intro, on the Victorian Brighton only', () => {
    expect(getLocality('victoria', 'bayside-and-peninsula', 'brighton')?.intro).toContain(
      'Newbay Medical',
    );
    expect(getLocality('queensland', 'brisbane-north', 'brighton')?.intro).toBeUndefined();
  });
});

describe('councils are attached', () => {
  it('gives every locality a council with real writing', () => {
    for (const l of allLocalities()) {
      expect(l.council.buildingStock.length, l.name).toBeGreaterThan(80);
    }
  });
});

describe('state and region helpers', () => {
  it('maps state keys to URL segments both ways', () => {
    expect(stateSlug('VIC')).toBe('victoria');
    expect(stateSlug('QLD')).toBe('queensland');
    expect(stateFromSlug('victoria')).toBe('VIC');
    expect(stateFromSlug('queensland')).toBe('QLD');
    expect(stateFromSlug('nsw')).toBeUndefined();
  });

  it('lists 9 Victorian and 13 Queensland regions', () => {
    expect(regionsInState('VIC')).toHaveLength(9);
    expect(regionsInState('QLD')).toHaveLength(13);
  });

  it('accounts for all 1,387 localities across the 22 regions', () => {
    const total = [...regionsInState('VIC'), ...regionsInState('QLD')].reduce(
      (sum, r) => sum + localitiesInRegion(r.slug).length,
      0,
    );
    expect(total).toBe(1387);
  });
});

describe('displayName', () => {
  it.each([
    ['VERMONT', 'Vermont'],
    ['CHIRNSIDE PARK', 'Chirnside Park'],
    ['MCKINNON', 'McKinnon'],
    ['BAYSWATER NORTH', 'Bayswater North'],
  ])('renders %s as %s', (input, expected) => {
    expect(displayName(input)).toBe(expected);
  });
});
