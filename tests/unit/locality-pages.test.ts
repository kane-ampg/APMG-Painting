import { describe, expect, it } from 'vitest';
import { allLocalities, indexableLocalities, regionsInState } from '@/lib/locations';
import { generateStaticParams as suburbParams } from '@/app/areas/[state]/[region]/[suburb]/page';
import { generateStaticParams as regionParams } from '@/app/areas/[state]/[region]/page';
import { generateStaticParams as stateParams } from '@/app/areas/[state]/page';

/**
 * Static params.
 *
 * Every locality must be reachable, and no route may be generated twice — a
 * duplicated param set is a duplicated page, which is a duplicate-content
 * problem the sitemap would not reveal.
 */

describe('suburb params', () => {
  it('generates one route per locality', () => {
    expect(suburbParams()).toHaveLength(1440);
  });

  it('carries all three segments in each entry', () => {
    for (const params of suburbParams()) {
      expect(params.state).toMatch(/^(victoria|queensland)$/);
      expect(params.region).toMatch(/^[a-z0-9-]+$/);
      expect(params.suburb).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('generates no duplicate route', () => {
    const keys = suburbParams().map((p) => `${p.state}/${p.region}/${p.suburb}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('matches the hrefs the merge layer publishes', () => {
    const fromParams = new Set(
      suburbParams().map((p) => `/areas/${p.state}/${p.region}/${p.suburb}/`),
    );
    for (const l of allLocalities()) {
      expect(fromParams, l.name).toContain(l.href);
    }
  });
});

describe('region and state params', () => {
  it('generates 22 region routes', () => {
    expect(regionParams()).toHaveLength(22);
  });

  it('generates 2 state routes', () => {
    expect(stateParams()).toEqual([{ state: 'victoria' }, { state: 'queensland' }]);
  });

  it('pairs each region with the state it belongs to', () => {
    const vic = new Set(regionsInState('VIC').map((r) => r.slug));
    for (const params of regionParams()) {
      expect(vic.has(params.region)).toBe(params.state === 'victoria');
    }
  });
});

describe('the page count the spec commits to', () => {
  it('is 1,465 pages of which 41 are indexable', () => {
    const pages = suburbParams().length + regionParams().length + stateParams().length + 1;
    expect(pages).toBe(1465);
    expect(indexableLocalities().length + 22 + 2 + 1).toBe(41);
  });
});
