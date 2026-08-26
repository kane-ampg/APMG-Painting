import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { allLocalities, indexableLocalities, regionsInState } from '@/lib/locations';
import { NearbySuburbs } from '@/components/sections/locality';
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

/**
 * Robots directives.
 *
 * `noindex, follow` is the whole basis for generating 1,440 pages instead of
 * 41: the Tier 3 pages are kept out of the index but stay crawlable, so the
 * links out of them carry equity up to the 22 region hubs. `buildMetadata`
 * originally derived `follow` from `index`, which quietly shipped
 * `noindex, nofollow` on all 1,424 of them and made every one a dead end.
 */
type Robots = { index: boolean; follow: boolean };

async function robotsFor(href: string): Promise<Robots> {
  vi.resetModules();

  const page = await import('@/app/areas/[state]/[region]/[suburb]/page');
  const [, , state = '', region = '', suburb = ''] = href.split('/');
  const meta = await page.generateMetadata({
    params: Promise.resolve({ state, region, suburb }),
  });
  return meta.robots as Robots;
}

afterEach(() => {
  vi.resetModules();
});

describe('suburb page robots directives', () => {
  const indexable = indexableLocalities()[0];
  const tier3 = allLocalities().find((l) => !l.indexable);

  it('has both a Tier 1 and a Tier 3 page to test', () => {
    expect(indexable).toBeDefined();
    expect(tier3).toBeDefined();
  });

  it('leaves a Tier 3 page crawlable at launch — noindex, follow', async () => {
    await expect(robotsFor(tier3!.href)).resolves.toEqual(
      expect.objectContaining({ index: false, follow: true }),
    );
  });

  it('indexes and follows a Tier 1 page at launch', async () => {
    await expect(robotsFor(indexable!.href)).resolves.toEqual(
      expect.objectContaining({ index: true, follow: true }),
    );
  });
});

/**
 * The nearby-suburbs slot.
 *
 * All 209 rural-fringe localities carry an empty `neighbourHrefs` — they are
 * held out of neighbour lists on purpose — so the block used to return null
 * and leave a hole where one of the six facts spec §8 requires should be.
 */
describe('the nearby-suburbs slot', () => {
  it('has fringe localities with no neighbours at all, so the branch is real', () => {
    expect(allLocalities().filter((l) => l.neighbourHrefs.length === 0)).toHaveLength(209);
  });

  it('renders something with a link on every suburb page', () => {
    for (const locality of allLocalities()) {
      const html = renderToStaticMarkup(createElement(NearbySuburbs, { locality }));
      expect(html, locality.href).toContain('<a ');
      expect(html.length, locality.href).toBeGreaterThan(100);
    }
  });
});
