# APMG Commercial — Foundation (Phases 1–3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the third APMG site — commercial painting only, VIC + QLD — with all 1,527 suburb pages rendering under a tiered indexability model and a four-layer sandbox lockdown that switches as one unit.

**Architecture:** Scaffold by copying `APMG Painting v2` (site 2), then strip every residential surface. A build-time Node script turns a third-party Australian locality dataset into a committed JSON file — deterministic, offline, reviewable as a diff. Four nested route segments (national → state → region → suburb) render from that data. Hand-authored content lives in separate override files keyed by slug and is merged at build; the generator never overwrites human copy.

**Tech Stack:** Next.js 16 (App Router, `trailingSlash: true`), React 19, TypeScript 5.7 (`strict`, `noUncheckedIndexedAccess`), Tailwind 3.4, Vitest 4, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-24-apmg-commercial-vic-qld-design.md`

**Covers:** Spec phases 1–3. Phases 4 (B2B re-pitch + linking matrix), 5 (Tier 1 content + schema) and 6 (sector × region) get their own plans.

## Global Constraints

- **Sandbox is the default.** `isSandbox` is true unless `NEXT_PUBLIC_SANDBOX === 'false'` exactly. Never invert this default.
- **All four noindex layers key off the same `isSandbox` value** and are tested in both states. See Task 3.
- **No residential surface anywhere** — no page, route, nav entry, FAQ, copy string, or type member.
- **Painting and painting-preparation only.** No plastering, rendering-as-a-service, repairs, or line marking.
- **Queensland copy discipline.** No QLD page may contain "based in", "our Brisbane", "our Gold Coast", "our Sunshine Coast", or "local to". Enforced by a test in Task 14.
- **No second `LocalBusiness`** while `qldPresence` is false. One entity, Bayswater North.
- **No `AggregateRating`** emitted anywhere. There are no first-party verified reviews.
- **URLs keep trailing slashes.** `trailingSlash: true` is set; every internal `href` ends in `/`.
- **Path alias** is `@/*` → repo root.
- **Anchor coordinates**, used verbatim:
  - Bayswater North VIC: `-37.845116, 145.270141`, radius `50` km
  - Brisbane CBD QLD: `-27.4698, 153.0251`, radius `40` km
  - Southport QLD: `-27.9680, 153.4000`, radius `40` km
  - Maroochydore QLD: `-26.6600, 153.0930`, radius `40` km
- **Expected locality total after all filters: 1,527.** A test asserts this exact number. If the upstream dataset shifts it, that is a review event, not a number to quietly update.
- **Commit after every task.** Conventional commit prefixes (`feat:`, `test:`, `chore:`, `fix:`).

---

## File Structure

**Created**

| File                                               | Responsibility                                                 |
| -------------------------------------------------- | -------------------------------------------------------------- |
| `lib/geo/haversine.ts`                             | Distance and bearing between two coordinates. Pure, no deps.   |
| `lib/geo/anchors.ts`                               | The four anchors as typed constants. Single source.            |
| `lib/locations/types.ts`                           | `Locality`, `Region`, `StateKey`, `Tier`, `GeneratedLocality`. |
| `lib/locations/regions.ts`                         | Region definitions and the council → region rules.             |
| `lib/locations/index.ts`                           | Read API over the generated data: lookups, grouping, tiering.  |
| `content/councils.ts`                              | 49 hand-authored council notes.                                |
| `content/locations.overrides.ts`                   | Hand-written suburb copy + `qldPresence` flag.                 |
| `content/locations.generated.json`                 | Generator output. Committed.                                   |
| `scripts/build-locations.mts`                      | The generator.                                                 |
| `app/locations/page.tsx`                           | National hub.                                                  |
| `app/locations/[state]/page.tsx`                   | State hub.                                                     |
| `app/locations/[state]/[region]/page.tsx`          | Region hub.                                                    |
| `app/locations/[state]/[region]/[suburb]/page.tsx` | Suburb page.                                                   |
| `components/locations/locality-facts.tsx`          | The six-fact block.                                            |
| `components/locations/suburb-directory.tsx`        | Grouped suburb link lists.                                     |

**Modified**

| File                                | Change                                              |
| ----------------------------------- | --------------------------------------------------- |
| `lib/site.ts`                       | Tagline, service area, QLD regions.                 |
| `next.config.ts`                    | Make `X-Robots-Tag` conditional; replace redirects. |
| `app/sitemap.ts`                    | Indexable-only across the new route tree.           |
| `components/navigation/nav-data.ts` | Remove residential; add Locations.                  |
| `lib/content/types.ts`              | Drop `'residential'` from `Audience`.               |

**Deleted**

`app/residential-painting/`, `app/areas/`, `app/[sector]/`, `app/office-painters/`, `app/trade-services/`, `content/locations.ts`, `scripts/sort-legacy-suburbs.mjs`.

---

## Task 1: Scaffold the new repo

**Files:**

- Create: `../APMG-Commercial/` (full copy of site 2, minus build artefacts and git history)

**Interfaces:**

- Consumes: nothing.
- Produces: a working Next.js repo at `../APMG-Commercial` whose `npm run verify` passes before any changes are made. **All later tasks run inside this directory.**

- [ ] **Step 1: Copy the tree, excluding artefacts**

```bash
cd "c:/Users/Kane/Desktop"
git clone --depth 1 "c:/Users/Kane/Desktop/APMG Painting v2" APMG-Commercial
cd APMG-Commercial
```

`git clone` copies only committed files, so `node_modules`, `.next`, `test-results` and the scratch dataset are excluded by construction.

**Before running this, commit or stash any uncommitted work in site 2** — a clone takes `HEAD`, not the working tree. Site 2 currently has substantial uncommitted changes:

```bash
cd "c:/Users/Kane/Desktop/APMG Painting v2" && git status --short | head -40
```

If those changes are wanted in the new site (they are — they are the v2 build), commit them in site 2 first.

- [ ] **Step 2: Reset identity and git history**

```bash
cd "c:/Users/Kane/Desktop/APMG-Commercial"
rm -rf docs/superpowers
sed -i 's/"name": "apmg-painting-website"/"name": "apmg-commercial-website"/' package.json
git init -q
git add -A
git commit -q -m "chore: scaffold from APMG Painting v2"
```

The spec and plan are deliberately not copied — they stay in site 2 and are referenced by path. Site 2's `docs/CLIENT-BRIEF.md` and `docs/chat-knowledge-base.md` do carry over.

- [ ] **Step 3: Install and verify the baseline is green**

```bash
npm install
npm run verify
```

Expected: PASS. If it fails, stop — the baseline must be green before anything is stripped, or later failures are unattributable.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -q -m "chore: verified baseline scaffold"
```

---

## Task 2: Remove the residential surface

**Files:**

- Delete: `app/residential-painting/page.tsx`
- Modify: `lib/content/types.ts`, `content/services.ts`, `content/faqs.ts`, `content/projects.ts`, `components/navigation/nav-data.ts`, `components/sections/index.tsx`, `lib/site.ts`
- Test: `tests/unit/no-residential.test.ts`

**Interfaces:**

- Consumes: Task 1's repo.
- Produces: `Audience = 'commercial'` (a one-member union — deliberate; it keeps every call site typed and makes a future re-widening a type change rather than a search). `ReviewWall` takes no `audience` prop.

- [ ] **Step 1: Write the failing test**

`tests/unit/no-residential.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { globSync, readFileSync } from 'node:fs';

const SOURCE_GLOB = ['app/**/*.tsx', 'components/**/*.tsx', 'content/**/*.ts', 'lib/**/*.ts'];

function sourceFiles(): string[] {
  return SOURCE_GLOB.flatMap((p) => globSync(p, { cwd: process.cwd() }));
}

describe('residential surface is gone', () => {
  const banned = [/\bresidential\b/i, /\bhouse painting\b/i, /\bhomeowner/i];

  it.each(banned.map((r) => [r.source, r] as const))('no source file matches %s', (_label, re) => {
    const hits = sourceFiles().filter((f) => re.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('has no residential route', () => {
    expect(globSync('app/residential-painting/**', { cwd: process.cwd() })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/no-residential.test.ts
```

Expected: FAIL, listing `app/residential-painting/page.tsx`, `content/services.ts`, `nav-data.ts` and others.

- [ ] **Step 3: Delete the route and narrow the type**

```bash
rm -rf app/residential-painting
```

In `lib/content/types.ts`:

```ts
/**
 * One member on purpose. This site is commercial only (spec §3), and a
 * one-member union keeps every call site typed, so re-widening later is a
 * type change the compiler walks you through rather than a grep.
 */
export type Audience = 'commercial';
```

- [ ] **Step 4: Strip residential from content and components**

In `content/services.ts`, set `audience: 'commercial'` on `interior-painting` and `exterior-painting` (they were `'both'`), and rename `property-maintenance` → `builders-and-head-contractors` with `shortTitle: 'Builders & head contractors'`.

In `content/faqs.ts`, delete every entry whose `audience` was `'residential'`, and change `'both'` to `'commercial'`.

In `content/projects.ts`, delete the `house-painting-glen-iris` project and remove its slug from any `relatedLocationSlugs` array.

Then **renormalise every remaining `relatedLocationSlugs` entry** to the new locality slug form. Site 2 used `painters-vermont`; the generator emits `vermont`. Task 9 matches projects to suburbs through exactly these slugs, so a stale prefix means the "nearest documented project" fact silently never renders — a failure with no error.

```
'painters-vermont'   -> 'vermont'
'painters-brighton'  -> 'brighton'
```

Strip the `painters-` prefix from each. Task 8's read API cannot validate these (projects are not part of the locality graph), so Task 9 adds the assertion that catches a stale slug.

```bash
grep -n "relatedLocationSlugs" content/projects.ts
```

In `components/sections/index.tsx`, delete `AudienceSplit` entirely and change `ReviewWall`'s signature from `({ audience }: { audience?: 'residential' | 'commercial' })` to `()`, removing the internal filter. Remove the now-unused import if one results.

In `components/navigation/nav-data.ts`, delete the `Residential` nav item and the `footerNav.residential` key.

In `lib/site.ts`, change the tagline to `'Commercial painters in Victoria and South East Queensland'`.

- [ ] **Step 5: Fix the fallout and confirm green**

```bash
npm run typecheck
```

TypeScript will point at every remaining reference — `AudienceSplit` on the home page, `ReviewWall audience=` props, residential nav links in the footer. Delete each usage rather than stubbing it.

```bash
npx vitest run tests/unit/no-residential.test.ts && npm run verify
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -q -m "feat: remove residential surface, narrow Audience to commercial"
```

---

## Task 3: Make the sandbox lockdown switch as one unit

**Files:**

- Modify: `next.config.ts`, `app/robots.ts`
- Test: `tests/unit/sandbox-lockdown.test.ts`

**Interfaces:**

- Consumes: `isSandbox` from `@/lib/site`.
- Produces: `sandboxHeaders(): Array<{ source: string; headers: Array<{ key: string; value: string }> }>` exported from `next.config.ts` so it is testable without booting Next.

This is the launch-blocking bug from spec §11. Site 2 sets `X-Robots-Tag: noindex, nofollow` unconditionally, so at go-live the header would keep saying `noindex` after every other layer switched off — and a header-level `noindex` wins. The site would launch permanently unindexable with no visible symptom.

- [ ] **Step 1: Write the failing test**

`tests/unit/sandbox-lockdown.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

async function load(sandboxValue: string | undefined) {
  vi.resetModules();
  if (sandboxValue === undefined) delete process.env.NEXT_PUBLIC_SANDBOX;
  else process.env.NEXT_PUBLIC_SANDBOX = sandboxValue;
  const config = await import('../../next.config');
  const robots = (await import('../../app/robots')).default;
  return { headers: await config.default.headers!(), robots: robots() };
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SANDBOX;
  vi.resetModules();
});

describe('sandbox lockdown', () => {
  it.each([undefined, 'true', '', 'FALSE'])(
    'locks down when NEXT_PUBLIC_SANDBOX is %s',
    async (value) => {
      const { headers, robots } = await load(value);
      const tag = headers
        .flatMap((h) => h.headers)
        .find((h) => h.key.toLowerCase() === 'x-robots-tag');
      expect(tag?.value).toBe('noindex, nofollow');
      expect(robots.rules).toEqual([{ userAgent: '*', disallow: '/' }]);
      expect(robots.sitemap).toBeUndefined();
    },
  );

  it('releases every layer together when set to exactly "false"', async () => {
    const { headers, robots } = await load('false');
    const tag = headers
      .flatMap((h) => h.headers)
      .find((h) => h.key.toLowerCase() === 'x-robots-tag');
    expect(tag).toBeUndefined();
    expect(robots.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
```

The `'FALSE'` case is the important one: only the exact lowercase string releases the lock.

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/sandbox-lockdown.test.ts
```

Expected: FAIL on the `'false'` case — `tag` is defined because the header is unconditional.

- [ ] **Step 3: Make the header conditional**

In `next.config.ts`, replace the `headers()` block:

```ts
import { isSandbox } from './lib/site';

/**
 * Header-level noindex.
 *
 * Conditional, and that is the whole point. Site 2 set this unconditionally,
 * which meant flipping NEXT_PUBLIC_SANDBOX to "false" at go-live would switch
 * off robots.txt and the meta tag while this header kept returning noindex —
 * and a header-level noindex overrides both. The site would have launched
 * permanently unindexable with nothing visible on the page to explain why.
 *
 * All four layers now key off the same value. They switch together or not at all.
 */
export function sandboxHeaders() {
  if (!isSandbox) return [];
  return [
    {
      source: '/:path*',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    },
  ];
}
```

and in the config object:

```ts
  async headers() {
    return sandboxHeaders();
  },
```

- [ ] **Step 4: Drop the stale redirects**

Site 2's three redirects point at `/areas/` slugs that do not exist in this build. Replace the whole `redirects()` body with:

```ts
  async redirects() {
    // Site 2's /areas/ slug corrections are not carried across: this build has
    // no /areas/ route. Legacy-URL mapping is a go-live task, out of scope here.
    return [];
  },
```

- [ ] **Step 5: Confirm green**

```bash
npx vitest run tests/unit/sandbox-lockdown.test.ts && npm run verify
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -q -m "fix: key X-Robots-Tag to isSandbox so all four noindex layers switch together"
```

---

## Task 4: Geo primitives

**Files:**

- Create: `lib/geo/haversine.ts`, `lib/geo/anchors.ts`
- Test: `tests/unit/geo.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `type Coords = { lat: number; lng: number }`
  - `distanceKm(a: Coords, b: Coords): number`
  - `bearingDeg(from: Coords, to: Coords): number` — 0–360, 0 = north
  - `type AnchorKey = 'bayswater-north' | 'brisbane' | 'southport' | 'maroochydore'`
  - `type Anchor = { key: AnchorKey; label: string; state: StateKey; coords: Coords; radiusKm: number }`
  - `ANCHORS: readonly Anchor[]`
  - `nearestAnchor(c: Coords, state: StateKey): { anchor: Anchor; distanceKm: number } | null` — null when outside every same-state radius

- [ ] **Step 1: Write the failing test**

`tests/unit/geo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ANCHORS, nearestAnchor } from '@/lib/geo/anchors';
import { bearingDeg, distanceKm } from '@/lib/geo/haversine';

const BAYSWATER_NORTH = { lat: -37.845116, lng: 145.270141 };
const MELBOURNE_CBD = { lat: -37.8136, lng: 144.9631 };
const BRISBANE_CBD = { lat: -27.4698, lng: 153.0251 };

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    expect(distanceKm(BAYSWATER_NORTH, BAYSWATER_NORTH)).toBeCloseTo(0, 6);
  });

  it('matches a known distance', () => {
    // Bayswater North to Melbourne CBD is ~27 km.
    expect(distanceKm(BAYSWATER_NORTH, MELBOURNE_CBD)).toBeGreaterThan(26);
    expect(distanceKm(BAYSWATER_NORTH, MELBOURNE_CBD)).toBeLessThan(29);
  });

  it('is symmetric', () => {
    expect(distanceKm(BAYSWATER_NORTH, BRISBANE_CBD)).toBeCloseTo(
      distanceKm(BRISBANE_CBD, BAYSWATER_NORTH),
      6,
    );
  });
});

describe('bearingDeg', () => {
  it('reads due north as 0', () => {
    expect(bearingDeg({ lat: -27.5, lng: 153.0 }, { lat: -27.4, lng: 153.0 })).toBeCloseTo(0, 1);
  });

  it('reads due east as 90', () => {
    expect(bearingDeg({ lat: -27.5, lng: 153.0 }, { lat: -27.5, lng: 153.1 })).toBeCloseTo(90, 1);
  });

  it('always returns 0-360', () => {
    const b = bearingDeg({ lat: -27.5, lng: 153.0 }, { lat: -27.6, lng: 152.9 });
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe('ANCHORS', () => {
  it('holds the four spec anchors with their exact radii', () => {
    expect(ANCHORS.map((a) => [a.key, a.radiusKm])).toEqual([
      ['bayswater-north', 50],
      ['brisbane', 40],
      ['southport', 40],
      ['maroochydore', 40],
    ]);
  });
});

describe('nearestAnchor', () => {
  it('assigns a Melbourne point to Bayswater North', () => {
    expect(nearestAnchor(MELBOURNE_CBD, 'VIC')?.anchor.key).toBe('bayswater-north');
  });

  it('assigns Southport to the Gold Coast anchor, not Brisbane', () => {
    expect(nearestAnchor({ lat: -27.968, lng: 153.4 }, 'QLD')?.anchor.key).toBe('southport');
  });

  it('never crosses state lines', () => {
    // A Victorian point must not match a Queensland anchor.
    expect(nearestAnchor(MELBOURNE_CBD, 'QLD')).toBeNull();
  });

  it('returns null outside every radius', () => {
    // Bendigo: ~130 km from Bayswater North.
    expect(nearestAnchor({ lat: -36.757, lng: 144.2794 }, 'VIC')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/geo.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/geo/haversine'`.

- [ ] **Step 3: Implement**

`lib/geo/haversine.ts`:

```ts
export type Coords = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance in kilometres. */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Initial bearing in degrees, 0-360, where 0 is north. */
export function bearingDeg(from: Coords, to: Coords): number {
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
```

`lib/geo/anchors.ts`:

```ts
import { distanceKm, type Coords } from './haversine';

export type StateKey = 'VIC' | 'QLD';
export type AnchorKey = 'bayswater-north' | 'brisbane' | 'southport' | 'maroochydore';

export type Anchor = {
  key: AnchorKey;
  label: string;
  state: StateKey;
  coords: Coords;
  radiusKm: number;
};

/** Spec §5. Coordinates and radii are used verbatim; do not round them. */
export const ANCHORS: readonly Anchor[] = [
  {
    key: 'bayswater-north',
    label: 'Bayswater North',
    state: 'VIC',
    coords: { lat: -37.845116, lng: 145.270141 },
    radiusKm: 50,
  },
  {
    key: 'brisbane',
    label: 'Brisbane',
    state: 'QLD',
    coords: { lat: -27.4698, lng: 153.0251 },
    radiusKm: 40,
  },
  {
    key: 'southport',
    label: 'Gold Coast',
    state: 'QLD',
    coords: { lat: -27.968, lng: 153.4 },
    radiusKm: 40,
  },
  {
    key: 'maroochydore',
    label: 'Sunshine Coast',
    state: 'QLD',
    coords: { lat: -26.66, lng: 153.093 },
    radiusKm: 40,
  },
] as const;

/**
 * Nearest in-radius anchor within the same state.
 *
 * State-scoped so a border locality cannot be pulled across, and nearest-wins
 * so overlapping radii (Caboolture sits in both Brisbane's and the Sunshine
 * Coast's) still yield exactly one URL per locality.
 */
export function nearestAnchor(
  c: Coords,
  state: StateKey,
): { anchor: Anchor; distanceKm: number } | null {
  let best: { anchor: Anchor; distanceKm: number } | null = null;
  for (const anchor of ANCHORS) {
    if (anchor.state !== state) continue;
    const d = distanceKm(anchor.coords, c);
    if (d > anchor.radiusKm) continue;
    if (!best || d < best.distanceKm) best = { anchor, distanceKm: d };
  }
  return best;
}
```

- [ ] **Step 4: Run and confirm green**

```bash
npx vitest run tests/unit/geo.test.ts
```

Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/geo tests/unit/geo.test.ts
git commit -q -m "feat: add haversine, bearing and nearest-anchor geo primitives"
```

---

## Task 5: Region model and council rules

**Files:**

- Create: `lib/locations/types.ts`, `lib/locations/regions.ts`
- Test: `tests/unit/regions.test.ts`

**Interfaces:**

- Consumes: `StateKey`, `Coords`, `bearingDeg`, `distanceKm` from Task 4.
- Produces:
  - `type Tier = 1 | 3` — no tier 2; region hubs are a different entity
  - `type RegionDef = { slug: string; name: string; state: StateKey; councils: readonly string[]; ruralFringe: boolean }`
  - `REGIONS: readonly RegionDef[]` — 22 entries
  - `CARDINIA_URBAN: readonly string[]`, `YARRA_RANGES_URBAN: readonly string[]`
  - `SINGLE_LOCALITY_COUNCIL_ALLOWLIST: readonly string[]` — `['Melton', 'Mitchell']`
  - `IMPOSSIBLE_COUNCILS: readonly string[]` — `['Surf Coast', 'South Gippsland']`
  - `resolveRegion(args: { council: string; locality: string; state: StateKey; coords: Coords }): RegionDef` — throws on no match
  - `isRuralFringe(council: string, locality: string): boolean`

Council names are matched against the dataset's `lgaregion` values verbatim, including its parenthesised disambiguators: `'Kingston (Vic.)'` and `'Bayside (Vic.)'`.

- [ ] **Step 1: Write the failing test**

`tests/unit/regions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { REGIONS, isRuralFringe, resolveRegion } from '@/lib/locations/regions';

describe('REGIONS', () => {
  it('has 22 regions', () => {
    expect(REGIONS).toHaveLength(22);
  });

  it('has unique slugs', () => {
    expect(new Set(REGIONS.map((r) => r.slug)).size).toBe(22);
  });

  it('has exactly one rural-fringe hub per state', () => {
    for (const state of ['VIC', 'QLD'] as const) {
      expect(REGIONS.filter((r) => r.state === state && r.ruralFringe)).toHaveLength(1);
    }
  });
});

describe('isRuralFringe', () => {
  it('flags an entire fringe council', () => {
    expect(isRuralFringe('Scenic Rim', 'BOONAH')).toBe(true);
    expect(isRuralFringe('Nillumbik', 'ST ANDREWS')).toBe(true);
  });

  it('splits Cardinia on the urban allowlist', () => {
    expect(isRuralFringe('Cardinia', 'PAKENHAM')).toBe(false);
    expect(isRuralFringe('Cardinia', 'GEMBROOK')).toBe(true);
  });

  it('splits Yarra Ranges on the urban allowlist', () => {
    expect(isRuralFringe('Yarra Ranges', 'LILYDALE')).toBe(false);
    expect(isRuralFringe('Yarra Ranges', 'POWELLTOWN')).toBe(true);
  });

  it('keeps APMG\u2019s own base out of the fringe', () => {
    expect(isRuralFringe('Yarra Ranges', 'CHIRNSIDE PARK')).toBe(false);
  });

  it('does not flag an ordinary metropolitan council', () => {
    expect(isRuralFringe('Monash', 'CLAYTON')).toBe(false);
  });
});

describe('resolveRegion', () => {
  const at = (lat: number, lng: number) => ({ lat, lng });

  it('maps a small council directly', () => {
    expect(
      resolveRegion({
        council: 'Monash',
        locality: 'CLAYTON',
        state: 'VIC',
        coords: at(-37.92, 145.12),
      }).slug,
    ).toBe('south-east');
  });

  it('puts urban Yarra Ranges in Eastern, not the hinterland', () => {
    expect(
      resolveRegion({
        council: 'Yarra Ranges',
        locality: 'CHIRNSIDE PARK',
        state: 'VIC',
        coords: at(-37.75, 145.31),
      }).slug,
    ).toBe('eastern');
  });

  it('puts rural Yarra Ranges in the hinterland', () => {
    expect(
      resolveRegion({
        council: 'Yarra Ranges',
        locality: 'POWELLTOWN',
        state: 'VIC',
        coords: at(-37.86, 145.75),
      }).slug,
    ).toBe('yarra-valley-and-hinterland');
  });

  it('splits Brisbane City by distance then bearing', () => {
    // Brisbane CBD itself: inside 5 km, so Inner.
    expect(
      resolveRegion({
        council: 'Brisbane',
        locality: 'BRISBANE CITY',
        state: 'QLD',
        coords: at(-27.4698, 153.0251),
      }).slug,
    ).toBe('brisbane-inner');
    // Aspley: ~12 km due north.
    expect(
      resolveRegion({
        council: 'Brisbane',
        locality: 'ASPLEY',
        state: 'QLD',
        coords: at(-27.3639, 153.0164),
      }).slug,
    ).toBe('brisbane-north');
    // Wynnum: ~14 km east.
    expect(
      resolveRegion({
        council: 'Brisbane',
        locality: 'WYNNUM',
        state: 'QLD',
        coords: at(-27.4436, 153.1728),
      }).slug,
    ).toBe('brisbane-east');
    // Sunnybank: ~12 km south.
    expect(
      resolveRegion({
        council: 'Brisbane',
        locality: 'SUNNYBANK',
        state: 'QLD',
        coords: at(-27.5786, 153.0594),
      }).slug,
    ).toBe('brisbane-south');
    // Indooroopilly: ~7 km west.
    expect(
      resolveRegion({
        council: 'Brisbane',
        locality: 'INDOOROOPILLY',
        state: 'QLD',
        coords: at(-27.4986, 152.9733),
      }).slug,
    ).toBe('brisbane-west');
  });

  it('throws on an unmapped council rather than guessing', () => {
    expect(() =>
      resolveRegion({
        council: 'Atlantis',
        locality: 'NOWHERE',
        state: 'VIC',
        coords: at(-37.8, 145.0),
      }),
    ).toThrow(/unmapped council/i);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/regions.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the types**

`lib/locations/types.ts`:

```ts
import type { Coords, StateKey } from '../geo/anchors';

export type { Coords, StateKey };

/**
 * Two tiers, not three.
 *
 * Tier 1 is indexable and hand-written; Tier 3 is noindex and templated.
 * The spec numbers them 1 and 3 with no 2 on purpose: region hubs occupy the
 * middle of the hierarchy but are a different entity with their own route, not
 * a tier of suburb. Renumbering to 1/2 would invite someone to conflate them.
 */
export type Tier = 1 | 3;

export type RegionDef = {
  slug: string;
  name: string;
  state: StateKey;
  /** Matched verbatim against the dataset's `lgaregion`. */
  councils: readonly string[];
  ruralFringe: boolean;
};

/** One locality, as emitted by scripts/build-locations.mjs. */
export type GeneratedLocality = {
  slug: string;
  name: string;
  state: StateKey;
  postcodes: readonly string[];
  coords: Coords;
  council: string;
  anchorKey: string;
  distanceKm: number;
  regionSlug: string;
  ruralFringe: boolean;
  tier: Tier;
  neighbourSlugs: readonly string[];
};
```

- [ ] **Step 4: Write the region definitions**

`lib/locations/regions.ts`:

```ts
import { bearingDeg, distanceKm } from '../geo/haversine';
import type { Coords, RegionDef, StateKey } from './types';

/** Localities in these councils are dropped: geographically impossible (spec §5.1). */
export const IMPOSSIBLE_COUNCILS: readonly string[] = ['Surf Coast', 'South Gippsland'];

/** Councils allowed to contribute <= 2 localities without failing the build (spec §5.1). */
export const SINGLE_LOCALITY_COUNCIL_ALLOWLIST: readonly string[] = ['Melton', 'Mitchell'];

/** Spec §5.2. Everything else in Cardinia is fringe. */
export const CARDINIA_URBAN: readonly string[] = [
  'PAKENHAM',
  'PAKENHAM UPPER',
  'OFFICER',
  'OFFICER SOUTH',
  'BEACONSFIELD',
  'BEACONSFIELD UPPER',
  'BUNYIP',
  'KOO WEE RUP',
  'LANG LANG',
  'EMERALD',
  'COCKATOO',
];

/** Spec §5.2. Urban Yarra Ranges, on the allowlist on its own merits. */
export const YARRA_RANGES_URBAN: readonly string[] = [
  'LILYDALE',
  'MOOROOLBARK',
  'CHIRNSIDE PARK',
  'MONTROSE',
  'KILSYTH SOUTH',
  'HEALESVILLE',
  'YARRA GLEN',
  'SEVILLE',
  'WANDIN NORTH',
  'WOORI YALLOCK',
  'BELGRAVE',
  'UPWEY',
  'TECOMA',
  'FERNY CREEK',
  'OLINDA',
];

/** Councils whose every locality is fringe. */
const WHOLLY_FRINGE_COUNCILS: readonly string[] = [
  'Scenic Rim',
  'Nillumbik',
  'Gympie',
  'Murrindindi',
  'Baw Baw',
  'Somerset',
];

const SPLIT_COUNCIL_URBAN: Record<string, readonly string[]> = {
  Cardinia: CARDINIA_URBAN,
  'Yarra Ranges': YARRA_RANGES_URBAN,
};

export function isRuralFringe(council: string, locality: string): boolean {
  if (WHOLLY_FRINGE_COUNCILS.includes(council)) return true;
  const urban = SPLIT_COUNCIL_URBAN[council];
  if (urban) return !urban.includes(locality.toUpperCase());
  return false;
}

/**
 * Brisbane City Council is 307 localities in one LGA, so it cannot be a region.
 * It splits on distance first (an inner core) then bearing (four quadrants).
 */
const BRISBANE_CBD: Coords = { lat: -27.4698, lng: 153.0251 };
const BRISBANE_INNER_RADIUS_KM = 5;

function brisbaneSubRegion(coords: Coords): string {
  if (distanceKm(BRISBANE_CBD, coords) <= BRISBANE_INNER_RADIUS_KM) return 'brisbane-inner';
  const b = bearingDeg(BRISBANE_CBD, coords);
  if (b >= 315 || b < 45) return 'brisbane-north';
  if (b < 135) return 'brisbane-east';
  if (b < 225) return 'brisbane-south';
  return 'brisbane-west';
}

export const REGIONS: readonly RegionDef[] = [
  // --- Victoria: 8 metropolitan + 1 hinterland ---
  {
    slug: 'inner-melbourne',
    name: 'Inner Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Melbourne', 'Port Phillip', 'Yarra'],
  },
  {
    slug: 'inner-east',
    name: 'Inner East',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Boroondara', 'Stonnington'],
  },
  {
    slug: 'eastern',
    name: 'Eastern Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Whitehorse', 'Manningham', 'Maroondah', 'Knox', 'Yarra Ranges'],
  },
  {
    slug: 'south-east',
    name: 'South East Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Monash', 'Greater Dandenong', 'Casey', 'Cardinia'],
  },
  {
    slug: 'bayside-and-peninsula',
    name: 'Bayside & Peninsula',
    state: 'VIC',
    ruralFringe: false,
    councils: [
      'Bayside (Vic.)',
      'Glen Eira',
      'Kingston (Vic.)',
      'Frankston',
      'Mornington Peninsula',
    ],
  },
  {
    slug: 'northern',
    name: 'Northern Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Darebin', 'Banyule', 'Whittlesea', 'Moreland'],
  },
  {
    slug: 'north-west',
    name: 'North West Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Hume', 'Moonee Valley', 'Melton', 'Mitchell'],
  },
  {
    slug: 'western',
    name: 'Western Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Brimbank', 'Maribyrnong', 'Hobsons Bay', 'Wyndham'],
  },
  {
    slug: 'yarra-valley-and-hinterland',
    name: 'Yarra Valley & Hinterland',
    state: 'VIC',
    ruralFringe: true,
    councils: ['Yarra Ranges', 'Nillumbik', 'Murrindindi', 'Baw Baw', 'Cardinia'],
  },

  // --- Queensland: 12 + 1 hinterland ---
  {
    slug: 'brisbane-inner',
    name: 'Inner Brisbane',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Brisbane'],
  },
  {
    slug: 'brisbane-north',
    name: 'Brisbane North',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Brisbane'],
  },
  {
    slug: 'brisbane-east',
    name: 'Brisbane East',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Brisbane'],
  },
  {
    slug: 'brisbane-south',
    name: 'Brisbane South',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Brisbane'],
  },
  {
    slug: 'brisbane-west',
    name: 'Brisbane West',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Brisbane'],
  },
  { slug: 'ipswich', name: 'Ipswich', state: 'QLD', ruralFringe: false, councils: ['Ipswich'] },
  { slug: 'logan', name: 'Logan', state: 'QLD', ruralFringe: false, councils: ['Logan'] },
  { slug: 'redlands', name: 'Redlands', state: 'QLD', ruralFringe: false, councils: ['Redland'] },
  {
    slug: 'moreton-bay',
    name: 'Moreton Bay',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Moreton Bay'],
  },
  {
    slug: 'sunshine-coast',
    name: 'Sunshine Coast',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Sunshine Coast'],
  },
  { slug: 'noosa', name: 'Noosa', state: 'QLD', ruralFringe: false, councils: ['Noosa'] },
  {
    slug: 'gold-coast',
    name: 'Gold Coast',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Gold Coast'],
  },
  {
    slug: 'seq-hinterland',
    name: 'South East Queensland Hinterland',
    state: 'QLD',
    ruralFringe: true,
    councils: ['Scenic Rim', 'Gympie', 'Somerset'],
  },
] as const;

const bySlug = new Map(REGIONS.map((r) => [r.slug, r]));

function region(slug: string): RegionDef {
  const found = bySlug.get(slug);
  if (!found) throw new Error(`Unknown region slug: ${slug}`);
  return found;
}

/**
 * Region for one locality. Geographic first, council second.
 *
 * Order matters: the fringe check runs before the council lookup, because
 * Yarra Ranges and Cardinia appear in two regions each and only the fringe
 * flag distinguishes them.
 */
export function resolveRegion(args: {
  council: string;
  locality: string;
  state: StateKey;
  coords: Coords;
}): RegionDef {
  const { council, locality, state, coords } = args;

  if (isRuralFringe(council, locality)) {
    return region(state === 'VIC' ? 'yarra-valley-and-hinterland' : 'seq-hinterland');
  }
  if (council === 'Brisbane') return region(brisbaneSubRegion(coords));

  const match = REGIONS.find(
    (r) => r.state === state && !r.ruralFringe && r.councils.includes(council),
  );
  if (!match) {
    throw new Error(
      `unmapped council "${council}" (locality ${locality}, ${state}). ` +
        `Add it to lib/locations/regions.ts REGIONS rather than defaulting it.`,
    );
  }
  return match;
}
```

- [ ] **Step 5: Run and confirm green**

```bash
npx vitest run tests/unit/regions.test.ts
```

Expected: PASS, 14 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/locations tests/unit/regions.test.ts
git commit -q -m "feat: add 22-region model with council rules and Brisbane bearing split"
```

---

## Task 6: The locality generator

**Files:**

- Create: `scripts/build-locations.mts`, `content/locations.generated.json`
- Delete: `scripts/sort-legacy-suburbs.mjs`
- Modify: `package.json`
- Test: `tests/unit/generated-localities.test.ts`

**Interfaces:**

- Consumes: `REGIONS`, `resolveRegion`, `isRuralFringe`, `IMPOSSIBLE_COUNCILS`, `SINGLE_LOCALITY_COUNCIL_ALLOWLIST` (Task 5); `ANCHORS`, `nearestAnchor`, `distanceKm` (Task 4).
- Produces: `content/locations.generated.json`, shape `{ generatedFrom: string; localities: GeneratedLocality[] }`. Committed.

The script imports the TypeScript region module. Run it through `tsx` rather than duplicating the rules in JS — two copies of the region logic would drift.

- [ ] **Step 1: Add the dev dependency and the script entry**

```bash
npm install -D tsx
```

In `package.json` `scripts`, remove nothing and add:

```json
    "locations:build": "tsx scripts/build-locations.mts"
```

Note the `.mts` extension — the script is TypeScript so it can import the region module directly.

- [ ] **Step 2: Write the failing test**

`tests/unit/generated-localities.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import data from '@/content/locations.generated.json';
import { REGIONS } from '@/lib/locations/regions';
import { ANCHORS } from '@/lib/geo/anchors';

const localities = data.localities;

describe('generated localities', () => {
  it('holds exactly the expected count', () => {
    // Spec §5. A change here is a review event, not a number to update.
    expect(localities).toHaveLength(1527);
  });

  it('gives every locality a unique slug', () => {
    expect(new Set(localities.map((l) => l.slug)).size).toBe(localities.length);
  });

  it('gives every locality a unique state+region+slug URL', () => {
    const urls = localities.map((l) => `${l.state}/${l.regionSlug}/${l.slug}`);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('resolves every locality to a real region in its own state', () => {
    const bySlug = new Map(REGIONS.map((r) => [r.slug, r]));
    for (const l of localities) {
      const region = bySlug.get(l.regionSlug);
      expect(region, `${l.name} -> ${l.regionSlug}`).toBeDefined();
      expect(region!.state).toBe(l.state);
    }
  });

  it('assigns every locality to an anchor within its radius', () => {
    const byKey = new Map(ANCHORS.map((a) => [a.key, a]));
    for (const l of localities) {
      const anchor = byKey.get(l.anchorKey);
      expect(anchor, l.name).toBeDefined();
      expect(l.distanceKm).toBeLessThanOrEqual(anchor!.radiusKm);
      expect(anchor!.state).toBe(l.state);
    }
  });

  it('never marks a rural-fringe locality as Tier 1', () => {
    expect(localities.filter((l) => l.ruralFringe && l.tier === 1)).toEqual([]);
  });

  it('never marks a Queensland locality as Tier 1 while qldPresence is false', () => {
    expect(localities.filter((l) => l.state === 'QLD' && l.tier === 1)).toEqual([]);
  });

  it('drops the geographically impossible councils', () => {
    const councils = new Set(localities.map((l) => l.council));
    expect(councils.has('Surf Coast')).toBe(false);
    expect(councils.has('South Gippsland')).toBe(false);
  });

  it('gives every non-fringe locality up to six non-fringe neighbours', () => {
    const byId = new Map(localities.map((l) => [l.slug, l]));
    for (const l of localities.filter((x) => !x.ruralFringe)) {
      expect(l.neighbourSlugs.length).toBeLessThanOrEqual(6);
      expect(l.neighbourSlugs).not.toContain(l.slug);
      for (const n of l.neighbourSlugs) {
        expect(byId.get(n)?.ruralFringe, `${l.name} -> ${n}`).toBe(false);
      }
    }
  });

  it('puts Chirnside Park in Eastern Melbourne, not the hinterland', () => {
    const cp = localities.find((l) => l.slug === 'chirnside-park');
    expect(cp?.regionSlug).toBe('eastern');
    expect(cp?.ruralFringe).toBe(false);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
npx vitest run tests/unit/generated-localities.test.ts
```

Expected: FAIL — `content/locations.generated.json` does not exist.

- [ ] **Step 4: Write the generator**

`scripts/build-locations.mts`:

```ts
/**
 * Turn the Australian locality dataset into content/locations.generated.json.
 *
 * The output is committed. Builds are deterministic and offline, CI never
 * depends on a third-party dataset being reachable, and regenerating produces
 * a reviewable diff rather than a silent change.
 *
 * USAGE
 *   npm run locations:build            # uses the cached download if present
 *   npm run locations:build -- --fetch # re-download first
 *
 * This script FAILS rather than degrading. A council that suddenly contributes
 * one locality, or a total that moves off 1,527, is a data problem that must be
 * looked at — not something to absorb quietly.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nearestAnchor } from '../lib/geo/anchors';
import { distanceKm } from '../lib/geo/haversine';
import {
  IMPOSSIBLE_COUNCILS,
  SINGLE_LOCALITY_COUNCIL_ALLOWLIST,
  isRuralFringe,
  resolveRegion,
} from '../lib/locations/regions';
import type { GeneratedLocality, StateKey } from '../lib/locations/types';

const SOURCE_URL =
  'https://raw.githubusercontent.com/matthewproctor/australianpostcodes/master/australian_postcodes.json';
const CACHE = resolve('.cache/australian_postcodes.json');
const OUT = resolve('content/locations.generated.json');
const EXPECTED_TOTAL = 1527;
const NEIGHBOUR_COUNT = 6;

/** Localities to exclude for reasons other than council. */
const EXCLUDED_REMOTENESS = new Set(['Remote Australia', 'Outer Regional Australia', '']);

/**
 * Tier 1 seed list (spec §7). VIC only: Queensland cannot carry a Tier 1 page
 * while qldPresence is false, because Tier 1 implies local evidence.
 */
const TIER_1_VIC = new Set([
  'BAYSWATER',
  'DANDENONG SOUTH',
  'NOTTING HILL',
  'PORT MELBOURNE',
  'CLAYTON',
  'BRAESIDE',
  'TULLAMARINE',
  'LAVERTON NORTH',
  'CAMPBELLFIELD',
  'VERMONT',
  'CHIRNSIDE PARK',
  'RINGWOOD',
  'BOX HILL',
  'RICHMOND',
  'SOUTH MELBOURNE',
]);

type Row = {
  locality?: string;
  state?: string;
  postcode?: string;
  type?: string;
  lat?: number;
  long?: number;
  Lat_precise?: number;
  Long_precise?: number;
  lgaregion?: string;
  RA_2021_NAME?: string;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadSource(): Promise<Row[]> {
  const wantsFetch = process.argv.includes('--fetch');
  if (wantsFetch || !existsSync(CACHE)) {
    process.stdout.write(`Downloading ${SOURCE_URL}\n`);
    const res = await fetch(SOURCE_URL);
    if (!res.ok) throw new Error(`Source fetch failed: HTTP ${res.status}`);
    mkdirSync(resolve('.cache'), { recursive: true });
    writeFileSync(CACHE, await res.text());
  }
  return JSON.parse(readFileSync(CACHE, 'utf8')) as Row[];
}

function fail(message: string): never {
  process.stderr.write(`\nGENERATOR FAILED\n  ${message}\n\n`);
  process.exit(1);
}

const rows = await loadSource();

// --- filter and dedupe -----------------------------------------------------
type Candidate = {
  name: string;
  state: StateKey;
  postcodes: Set<string>;
  lat: number;
  lng: number;
  council: string;
};

const candidates = new Map<string, Candidate>();

for (const r of rows) {
  if (r.type !== 'Delivery Area') continue;
  if (r.state !== 'VIC' && r.state !== 'QLD') continue;
  if (!r.locality || !r.lgaregion) continue;
  if (EXCLUDED_REMOTENESS.has(r.RA_2021_NAME ?? '')) continue;
  if (IMPOSSIBLE_COUNCILS.includes(r.lgaregion)) continue;

  const lat = r.Lat_precise ?? r.lat;
  const lng = r.Long_precise ?? r.long;
  if (typeof lat !== 'number' || typeof lng !== 'number') continue;

  const key = `${r.state}|${r.locality}`;
  const existing = candidates.get(key);
  if (existing) {
    if (r.postcode) existing.postcodes.add(r.postcode);
    continue;
  }
  candidates.set(key, {
    name: r.locality,
    state: r.state,
    postcodes: new Set(r.postcode ? [r.postcode] : []),
    lat,
    lng,
    council: r.lgaregion,
  });
}

// --- radius and nearest-anchor assignment ----------------------------------
const inRadius: Array<Candidate & { anchorKey: string; distanceKm: number }> = [];

for (const c of candidates.values()) {
  const match = nearestAnchor({ lat: c.lat, lng: c.lng }, c.state);
  if (!match) continue;
  inRadius.push({ ...c, anchorKey: match.anchor.key, distanceKm: match.distanceKm });
}

// --- sanity check: fail loudly on suspicious councils ----------------------
const councilCounts = new Map<string, number>();
for (const c of inRadius) councilCounts.set(c.council, (councilCounts.get(c.council) ?? 0) + 1);

const suspicious = [...councilCounts.entries()]
  .filter(([council, n]) => n <= 2 && !SINGLE_LOCALITY_COUNCIL_ALLOWLIST.includes(council))
  .map(([council, n]) => `${council} (${n})`);

if (suspicious.length > 0) {
  fail(
    `These councils contribute <= 2 localities and are not allowlisted:\n    ` +
      suspicious.join('\n    ') +
      `\n\n  Either they are bad coordinates (drop them via IMPOSSIBLE_COUNCILS)\n` +
      `  or they are legitimate edge cases (add to SINGLE_LOCALITY_COUNCIL_ALLOWLIST).\n` +
      `  Both are human decisions. This script will not guess.`,
  );
}

// --- region, fringe, tier --------------------------------------------------
const localities: GeneratedLocality[] = inRadius.map((c) => {
  const coords = { lat: c.lat, lng: c.lng };
  const ruralFringe = isRuralFringe(c.council, c.name);
  const region = resolveRegion({
    council: c.council,
    locality: c.name,
    state: c.state,
    coords,
  });
  const tier: 1 | 3 =
    !ruralFringe && c.state === 'VIC' && TIER_1_VIC.has(c.name.toUpperCase()) ? 1 : 3;

  return {
    slug: slugify(c.name),
    name: c.name,
    state: c.state,
    postcodes: [...c.postcodes].sort(),
    coords,
    council: c.council,
    anchorKey: c.anchorKey,
    distanceKm: Number(c.distanceKm.toFixed(2)),
    regionSlug: region.slug,
    ruralFringe,
    tier,
    neighbourSlugs: [],
  };
});

// --- slug collisions -------------------------------------------------------
const slugCounts = new Map<string, string[]>();
for (const l of localities) {
  slugCounts.set(l.slug, [...(slugCounts.get(l.slug) ?? []), `${l.name} ${l.state}`]);
}
const collisions = [...slugCounts.entries()].filter(([, names]) => names.length > 1);
if (collisions.length > 0) {
  fail(
    `Slug collisions:\n    ` +
      collisions.map(([slug, names]) => `${slug}: ${names.join(', ')}`).join('\n    '),
  );
}

// --- neighbours ------------------------------------------------------------
// Non-fringe only, on both sides: a fringe locality is not a useful internal
// link target, and linking into farmland from a commercial page dilutes both.
const linkable = localities.filter((l) => !l.ruralFringe);
for (const l of linkable) {
  l.neighbourSlugs = linkable
    .filter((o) => o.slug !== l.slug && o.state === l.state)
    .map((o) => ({ slug: o.slug, d: distanceKm(l.coords, o.coords) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, NEIGHBOUR_COUNT)
    .map((o) => o.slug);
}

// --- total check -----------------------------------------------------------
if (localities.length !== EXPECTED_TOTAL) {
  fail(
    `Expected ${EXPECTED_TOTAL} localities, got ${localities.length}.\n` +
      `  The upstream dataset has changed. Review the diff, confirm it is\n` +
      `  correct, then update EXPECTED_TOTAL here and in the test.`,
  );
}

localities.sort((a, b) => a.state.localeCompare(b.state) || a.slug.localeCompare(b.slug));

writeFileSync(OUT, JSON.stringify({ generatedFrom: SOURCE_URL, localities }, null, 2) + '\n');

process.stdout.write(
  `Wrote ${localities.length} localities to ${OUT}\n` +
    `  Tier 1: ${localities.filter((l) => l.tier === 1).length}\n` +
    `  Rural fringe: ${localities.filter((l) => l.ruralFringe).length}\n` +
    `  Councils: ${new Set(localities.map((l) => l.council)).size}\n`,
);
```

- [ ] **Step 5: Run the generator**

```bash
rm -f scripts/sort-legacy-suburbs.mjs
echo ".cache/" >> .gitignore
npm run locations:build
```

Expected: writes 1,527 localities, 15 Tier 1, ~243 rural fringe, ~45 councils.

If it fails on the sanity check or the total, **do not edit the numbers to make it pass.** Read what it reports, decide whether the data or the rules are wrong, and fix that.

- [ ] **Step 6: Confirm green**

```bash
npx vitest run tests/unit/generated-localities.test.ts && npm run verify
```

Expected: PASS, 10 tests.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -q -m "feat: generate 1,527 committed localities with failing sanity checks"
```

---

## Task 7: Council notes

**Files:**

- Create: `content/councils.ts`
- Test: `tests/unit/councils.test.ts`

**Interfaces:**

- Consumes: `content/locations.generated.json`.
- Produces:
  - `type Council = { name: string; state: StateKey; buildingStock: string; note: string }`
  - `COUNCILS: readonly Council[]`
  - `getCouncil(name: string): Council | undefined`

This is the leverage that makes 1,527 differentiated pages affordable: authored once per council, inherited by every suburb in it.

- [ ] **Step 1: Write the failing test**

`tests/unit/councils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import data from '@/content/locations.generated.json';
import { COUNCILS, getCouncil } from '@/content/councils';

const usedCouncils = [...new Set(data.localities.map((l) => l.council))].sort();

describe('council notes', () => {
  it('covers every council that appears in the generated data', () => {
    const missing = usedCouncils.filter((c) => !getCouncil(c));
    expect(missing).toEqual([]);
  });

  it('has no council note that is never used', () => {
    const unused = COUNCILS.map((c) => c.name).filter((n) => !usedCouncils.includes(n));
    expect(unused).toEqual([]);
  });

  it('gives every council substantive, distinct copy', () => {
    for (const c of COUNCILS) {
      expect(c.buildingStock.length, c.name).toBeGreaterThan(40);
      expect(c.note.length, c.name).toBeGreaterThan(60);
    }
    expect(new Set(COUNCILS.map((c) => c.note)).size).toBe(COUNCILS.length);
    expect(new Set(COUNCILS.map((c) => c.buildingStock)).size).toBe(COUNCILS.length);
  });

  it('never claims a Queensland presence', () => {
    const banned = /based in|our brisbane|our gold coast|our sunshine coast|local to/i;
    for (const c of COUNCILS.filter((x) => x.state === 'QLD')) {
      expect(banned.test(`${c.buildingStock} ${c.note}`), c.name).toBe(false);
    }
  });
});
```

The distinctness assertions are the point. A copy-pasted note would satisfy a length check and fail these.

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/councils.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: List the councils you must write**

```bash
node -e "const d=require('./content/locations.generated.json');const m=new Map();for(const l of d.localities)m.set(l.council,(m.get(l.council)||0)+1);[...m.entries()].sort((a,b)=>b[1]-a[1]).forEach(([c,n])=>console.log(String(n).padStart(4),c))"
```

- [ ] **Step 4: Author the file**

`content/councils.ts`. One entry per council from Step 3. Two fields carry real information and must be specific to that council:

- `buildingStock` — the commercial building types that actually dominate. "Tilt-slab warehousing and factory units through the Dandenong South estate, with a strip of older brick-and-render retail along Cheltenham Road" is right. "A mix of commercial buildings" is not.
- `note` — the operational fact a facilities manager cares about: heritage overlay coverage, permit behaviour, access constraints, typical building age.

```ts
import type { StateKey } from '@/lib/locations/types';

export type Council = {
  name: string;
  state: StateKey;
  /** Dominant commercial building stock. Specific to this council. */
  buildingStock: string;
  /** The operational fact that changes how work is scoped here. */
  note: string;
};

/**
 * Authored once per council, inherited by every suburb in it.
 *
 * This is what makes 1,527 differentiated pages affordable: 47 pieces of real
 * writing instead of 1,527 name-swapped templates. Names match the dataset's
 * `lgaregion` verbatim, parenthesised disambiguators included.
 */
export const COUNCILS: readonly Council[] = [
  {
    name: 'Greater Dandenong',
    state: 'VIC',
    buildingStock:
      'Tilt-slab warehousing and factory units across the Dandenong South estate, with older brick-and-render showroom and retail frontage along Cheltenham and Princes Highway.',
    note: 'Victoria\u2019s largest concentration of manufacturing floor space. Most work here is scoped around production that does not stop, so night and weekend access is normal rather than exceptional, and coating selection is driven by wash-down and forklift-impact exposure.',
  },
  {
    name: 'Boroondara',
    state: 'VIC',
    buildingStock:
      'Interwar and Victorian-era commercial frontage through Camberwell, Hawthorn and Kew, plus post-war office and medical conversions on the arterials.',
    note: 'One of the most heavily heritage-overlaid municipalities in metropolitan Melbourne. Exterior colour changes on a contributory building frequently need a planning permit, which has to be allowed for in the programme rather than discovered mid-job.',
  },
  // ... continue for every council from Step 3.
] as const;

const byName = new Map(COUNCILS.map((c) => [c.name, c]));

export function getCouncil(name: string): Council | undefined {
  return byName.get(name);
}
```

- [ ] **Step 5: Confirm green**

```bash
npx vitest run tests/unit/councils.test.ts && npm run verify
```

Expected: PASS, 4 tests. If "no council note that is never used" fails, a name does not match the dataset verbatim — check for `(Vic.)`.

- [ ] **Step 6: Commit**

```bash
git add content/councils.ts tests/unit/councils.test.ts
git commit -q -m "feat: add per-council building stock and operational notes"
```

---

## Task 8: Overrides and the read API

**Files:**

- Create: `content/locations.overrides.ts`, `lib/locations/index.ts`
- Delete: `content/locations.ts`
- Test: `tests/unit/locations-api.test.ts`

**Interfaces:**

- Consumes: Tasks 5–7.
- Produces:
  - `type Locality = GeneratedLocality & { council: Council; intro?: string; localNotes?: readonly string[]; indexable: boolean; href: string }`
  - `qldPresence: boolean` (from overrides, currently `false`)
  - `allLocalities(): readonly Locality[]`
  - `getLocality(state, region, suburb): Locality | undefined`
  - `localitiesInRegion(regionSlug: string): readonly Locality[]`
  - `regionsInState(state: StateKey): readonly RegionDef[]`
  - `indexableLocalities(): readonly Locality[]`
  - `stateSlug(state: StateKey): 'victoria' | 'queensland'` and `stateFromSlug(slug: string): StateKey | undefined`

`indexable` is derived, never stored: `tier === 1 && !ruralFringe && (state === 'VIC' || qldPresence)`. Storing it would let it drift from the tier.

- [ ] **Step 1: Write the failing test**

`tests/unit/locations-api.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  allLocalities,
  getLocality,
  indexableLocalities,
  localitiesInRegion,
  regionsInState,
  stateFromSlug,
  stateSlug,
} from '@/lib/locations';
import { qldPresence } from '@/content/locations.overrides';

describe('state slugs', () => {
  it('round-trips', () => {
    expect(stateFromSlug(stateSlug('VIC'))).toBe('VIC');
    expect(stateFromSlug(stateSlug('QLD'))).toBe('QLD');
    expect(stateSlug('VIC')).toBe('victoria');
    expect(stateSlug('QLD')).toBe('queensland');
  });

  it('rejects an unknown slug', () => {
    expect(stateFromSlug('new-south-wales')).toBeUndefined();
  });
});

describe('allLocalities', () => {
  it('attaches a council object to every locality', () => {
    for (const l of allLocalities()) {
      expect(l.council.name, l.name).toBeTruthy();
    }
  });

  it('builds an href that matches the route shape', () => {
    const l = allLocalities().find((x) => x.slug === 'chirnside-park')!;
    expect(l.href).toBe('/locations/victoria/eastern/chirnside-park/');
  });
});

describe('indexability', () => {
  it('is derived from tier, fringe and state', () => {
    for (const l of allLocalities()) {
      const expected = l.tier === 1 && !l.ruralFringe && (l.state === 'VIC' || qldPresence);
      expect(l.indexable, l.name).toBe(expected);
    }
  });

  it('marks no Queensland locality indexable while qldPresence is false', () => {
    expect(qldPresence).toBe(false);
    expect(indexableLocalities().filter((l) => l.state === 'QLD')).toEqual([]);
  });

  it('marks no rural-fringe locality indexable', () => {
    expect(indexableLocalities().filter((l) => l.ruralFringe)).toEqual([]);
  });
});

describe('lookups', () => {
  it('finds a locality by its three route segments', () => {
    expect(getLocality('victoria', 'eastern', 'chirnside-park')?.name).toBe('CHIRNSIDE PARK');
  });

  it('returns undefined for a wrong region', () => {
    expect(getLocality('victoria', 'western', 'chirnside-park')).toBeUndefined();
  });

  it('lists every region in a state, non-empty', () => {
    for (const state of ['VIC', 'QLD'] as const) {
      const regions = regionsInState(state);
      expect(regions.length).toBeGreaterThan(0);
      for (const r of regions) {
        expect(localitiesInRegion(r.slug).length, r.slug).toBeGreaterThan(0);
      }
    }
  });
});
```

The last assertion matters: a region with no localities would render an empty hub page.

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/locations-api.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the overrides file**

`content/locations.overrides.ts`:

```ts
/**
 * Hand-written suburb copy, keyed by slug, merged over the generated data.
 *
 * Kept separate so scripts/build-locations.mts can be re-run at any time
 * without destroying human writing.
 */
export type LocalityOverride = {
  intro?: string;
  localNotes?: readonly string[];
};

/**
 * Queensland presence.
 *
 * False because APMG has no Queensland address, no completed Queensland
 * projects and no Queensland phone number (spec §9). While this is false:
 * no second LocalBusiness entity, no QLD locality is indexable, and no QLD
 * copy may claim local presence.
 *
 * Flip it only when APMG supplies an address or a documented project.
 */
export const qldPresence = false;

export const localityOverrides: Readonly<Record<string, LocalityOverride>> = {};
```

- [ ] **Step 4: Write the read API**

`lib/locations/index.ts`:

```ts
import generated from '@/content/locations.generated.json';
import { getCouncil, type Council } from '@/content/councils';
import { localityOverrides, qldPresence } from '@/content/locations.overrides';
import { REGIONS } from './regions';
import type { GeneratedLocality, RegionDef, StateKey } from './types';

export type Locality = Omit<GeneratedLocality, 'council'> & {
  council: Council;
  intro?: string;
  localNotes?: readonly string[];
  /** Derived, never stored — see below. */
  indexable: boolean;
  href: string;
};

const STATE_SLUGS = { VIC: 'victoria', QLD: 'queensland' } as const;

export function stateSlug(state: StateKey): (typeof STATE_SLUGS)[StateKey] {
  return STATE_SLUGS[state];
}

export function stateFromSlug(slug: string): StateKey | undefined {
  return (Object.keys(STATE_SLUGS) as StateKey[]).find((k) => STATE_SLUGS[k] === slug);
}

/**
 * Indexability is computed, not stored.
 *
 * Storing it in the generated JSON would let it drift from `tier` the first
 * time someone hand-edited one and not the other. There is one rule and it
 * lives here.
 */
function computeIndexable(l: GeneratedLocality): boolean {
  if (l.tier !== 1) return false;
  if (l.ruralFringe) return false;
  return l.state === 'VIC' || qldPresence;
}

const ALL: readonly Locality[] = (generated.localities as GeneratedLocality[]).map((l) => {
  const council = getCouncil(l.council);
  if (!council) {
    throw new Error(
      `No council note for "${l.council}" (${l.name}). Add it to content/councils.ts.`,
    );
  }
  const override = localityOverrides[l.slug];
  return {
    ...l,
    council,
    intro: override?.intro,
    localNotes: override?.localNotes,
    indexable: computeIndexable(l),
    href: `/locations/${stateSlug(l.state)}/${l.regionSlug}/${l.slug}/`,
  };
});

const BY_URL = new Map(ALL.map((l) => [l.href, l]));

export function allLocalities(): readonly Locality[] {
  return ALL;
}

export function getLocality(state: string, region: string, suburb: string): Locality | undefined {
  return BY_URL.get(`/locations/${state}/${region}/${suburb}/`);
}

export function localitiesInRegion(regionSlug: string): readonly Locality[] {
  return ALL.filter((l) => l.regionSlug === regionSlug);
}

export function regionsInState(state: StateKey): readonly RegionDef[] {
  return REGIONS.filter((r) => r.state === state);
}

export function indexableLocalities(): readonly Locality[] {
  return ALL.filter((l) => l.indexable);
}

export { REGIONS };
export type { RegionDef, StateKey };
```

- [ ] **Step 5: Remove the old locations file**

```bash
rm content/locations.ts
npm run typecheck
```

TypeScript will flag `app/areas/`, `app/sitemap.ts` and `ServiceAreas` in `components/sections/index.tsx`. Delete `app/areas/` now; the other two are fixed in Tasks 12 and 13.

```bash
rm -rf app/areas
```

For `ServiceAreas`, change its prop type from `readonly Location[]` to `readonly Locality[]` (import from `@/lib/locations`) and render `l.name` and `l.href`.

- [ ] **Step 6: Confirm green**

```bash
npx vitest run tests/unit/locations-api.test.ts && npm run typecheck
```

Expected: PASS, 9 tests.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -q -m "feat: add locality read API with derived indexability"
```

---

## Task 9: The locality facts component

**Files:**

- Create: `components/locations/locality-facts.tsx`
- Test: `tests/unit/locality-facts.test.tsx`

**Interfaces:**

- Consumes: `Locality` (Task 8), `getProject` from `@/content/projects`.
- Produces: `<LocalityFacts locality={...} />`, and `driveBand(distanceKm: number): string`.

The six facts from spec §8. This component is why a Tier 3 page is not a name-swapped template.

- [ ] **Step 1: Write the failing test**

`tests/unit/locality-facts.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocalityFacts, driveBand } from '@/components/locations/locality-facts';
import { projects } from '@/content/projects';
import { allLocalities } from '@/lib/locations';

const chirnsidePark = allLocalities().find((l) => l.slug === 'chirnside-park')!;
const distant = allLocalities().find((l) => l.distanceKm > 45)!;

describe('driveBand', () => {
  it('buckets by distance', () => {
    expect(driveBand(5)).toBe('under 20 minutes');
    expect(driveBand(25)).toBe('20 to 40 minutes');
    expect(driveBand(38)).toBe('40 to 60 minutes');
    expect(driveBand(48)).toBe('over an hour');
  });
});

describe('LocalityFacts', () => {
  it('renders the council name', () => {
    render(<LocalityFacts locality={chirnsidePark} />);
    expect(screen.getByText(/Yarra Ranges/)).toBeInTheDocument();
  });

  it('renders the council building stock, not a generic phrase', () => {
    render(<LocalityFacts locality={chirnsidePark} />);
    expect(screen.getByText(chirnsidePark.council.buildingStock)).toBeInTheDocument();
  });

  it('renders a postcode', () => {
    render(<LocalityFacts locality={chirnsidePark} />);
    expect(screen.getByText(new RegExp(chirnsidePark.postcodes[0]!))).toBeInTheDocument();
  });

  it('renders a drive band for a distant suburb', () => {
    render(<LocalityFacts locality={distant} />);
    expect(screen.getByText(/over an hour|40 to 60 minutes/)).toBeInTheDocument();
  });

  it('produces different output for two different suburbs', () => {
    const { container: a } = render(<LocalityFacts locality={chirnsidePark} />);
    const { container: b } = render(<LocalityFacts locality={distant} />);
    expect(a.textContent).not.toBe(b.textContent);
  });
});

describe('project-to-locality links', () => {
  // Task 2 renormalised these from "painters-vermont" to "vermont". A stale
  // slug makes the nearest-project fact vanish with no error, so assert it.
  it('resolves every relatedLocationSlug to a real locality', () => {
    const slugs = new Set(allLocalities().map((l) => l.slug));
    for (const p of projects) {
      for (const s of p.relatedLocationSlugs) {
        expect(slugs.has(s), `${p.slug} -> ${s}`).toBe(true);
      }
    }
  });

  it('renders a nearest project for a suburb near a documented job', () => {
    const vermont = allLocalities().find((l) => l.slug === 'vermont')!;
    render(<LocalityFacts locality={vermont} />);
    expect(screen.getByText(/Nearest documented project/i)).toBeInTheDocument();
  });
});
```

The last test is the anti-template guard.

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/locality-facts.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`components/locations/locality-facts.tsx`:

```tsx
import Link from 'next/link';
import { projects } from '@/content/projects';
import { allLocalities, type Locality } from '@/lib/locations';
import { distanceKm } from '@/lib/geo/haversine';
import { site } from '@/lib/site';

/**
 * Distance to a spoken travel band.
 *
 * Bands, not minutes: a computed "37 minutes" reads as a promise, and traffic
 * on the Monash makes it one we cannot keep.
 */
export function driveBand(km: number): string {
  if (km < 15) return 'under 20 minutes';
  if (km < 30) return '20 to 40 minutes';
  if (km < 45) return '40 to 60 minutes';
  return 'over an hour';
}

/**
 * The closest documented project to this suburb.
 *
 * The link runs project -> locality, via `Project.relatedLocationSlugs`.
 * There is deliberately no `projectSlugs` field on `Locality`: a locality is
 * generated data and a project is hand-written, so pointing the generated
 * side at the authored side would mean the generator had to know about
 * content it does not own.
 */
function nearestProject(locality: Locality) {
  const bySlug = new Map(allLocalities().map((l) => [l.slug, l]));

  const sited = projects.flatMap((project) =>
    project.relatedLocationSlugs
      .map((slug) => bySlug.get(slug))
      .filter((at): at is Locality => at !== undefined && at.state === locality.state)
      .map((at) => ({ project, at, km: distanceKm(locality.coords, at.coords) })),
  );

  if (sited.length === 0) return null;
  return sited.sort((a, b) => a.km - b.km)[0]!;
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-ink-100 border-t py-4">
      <dt className="text-xs font-semibold uppercase tracking-label text-brand-600">{label}</dt>
      <dd className="text-ink-700 mt-1 text-sm">{children}</dd>
    </div>
  );
}

export function LocalityFacts({ locality }: { locality: Locality }) {
  const project = nearestProject(locality);
  const neighbours = locality.neighbourSlugs
    .map((s) => allLocalities().find((l) => l.slug === s))
    .filter((l): l is Locality => l !== undefined);

  return (
    <dl className="grid gap-x-10 sm:grid-cols-2">
      <Fact label="Local council">{locality.council.name}</Fact>
      <Fact label="Postcode">{locality.postcodes.join(', ')}</Fact>
      <Fact label="Commercial building stock">{locality.council.buildingStock}</Fact>
      <Fact label={`From our ${site.address.suburb} base`}>
        {locality.distanceKm.toFixed(0)} km, {driveBand(locality.distanceKm)} in normal traffic
      </Fact>
      <Fact label="Working in this council">{locality.council.note}</Fact>
      {project && (
        <Fact label="Nearest documented project">
          <Link href={`/projects/${project.project.slug}/`} className="underline">
            {project.project.title}
          </Link>{' '}
          — {project.km.toFixed(0)} km away
        </Fact>
      )}
      {neighbours.length > 0 && (
        <Fact label="Nearby suburbs we service">
          {neighbours.map((n, i) => (
            <span key={n.slug}>
              {i > 0 && ', '}
              <Link href={n.href} className="underline">
                {n.name}
              </Link>
            </span>
          ))}
        </Fact>
      )}
    </dl>
  );
}
```

- [ ] **Step 4: Confirm green**

```bash
npx vitest run tests/unit/locality-facts.test.tsx
```

Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add components/locations tests/unit/locality-facts.test.tsx
git commit -q -m "feat: add six-fact locality block"
```

---

## Task 10: Suburb pages

**Files:**

- Create: `app/locations/[state]/[region]/[suburb]/page.tsx`
- Test: `tests/unit/suburb-page.test.ts`

**Interfaces:**

- Consumes: Tasks 8, 9; `buildMetadata` from `@/lib/seo/metadata`; `breadcrumbSchema` from `@/lib/schema`.
- Produces: 1,527 static routes.

- [ ] **Step 1: Write the failing test**

`tests/unit/suburb-page.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { generateStaticParams } from '@/app/locations/[state]/[region]/[suburb]/page';
import { allLocalities } from '@/lib/locations';

describe('suburb routes', () => {
  it('generates one param set per locality', async () => {
    const params = await generateStaticParams();
    expect(params).toHaveLength(1527);
  });

  it('generates params that match each locality href exactly', async () => {
    const params = await generateStaticParams();
    const built = new Set(params.map((p) => `/locations/${p.state}/${p.region}/${p.suburb}/`));
    for (const l of allLocalities()) {
      expect(built.has(l.href), l.name).toBe(true);
    }
  });

  it('produces no duplicate routes', async () => {
    const params = await generateStaticParams();
    const keys = params.map((p) => `${p.state}/${p.region}/${p.suburb}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/suburb-page.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`app/locations/[state]/[region]/[suburb]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { LocalityFacts } from '@/components/locations/locality-facts';
import { CtaBand } from '@/components/sections';
import { Container, Prose, Section } from '@/components/ui';
import { breadcrumbSchema } from '@/lib/schema';
import { allLocalities, getLocality, REGIONS, stateSlug } from '@/lib/locations';

export const dynamicParams = false;

export function generateStaticParams() {
  return allLocalities().map((l) => ({
    state: stateSlug(l.state),
    region: l.regionSlug,
    suburb: l.slug,
  }));
}

type Props = { params: Promise<{ state: string; region: string; suburb: string }> };

/** Title-case a dataset locality name, which arrives as "BAYSWATER NORTH". */
function displayName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bMc([a-z])/g, (_, c: string) => `Mc${c.toUpperCase()}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, region, suburb } = await params;
  const locality = getLocality(state, region, suburb);
  if (!locality) return {};
  const name = displayName(locality.name);

  return buildMetadata({
    title: `Commercial Painters ${name} | APMG Painting`,
    description: `Commercial painting in ${name}, ${locality.council.name}. Offices, retail, industrial and strata. Get a scoped quote from APMG Painting.`,
    path: locality.href,
    index: locality.indexable,
  });
}

export default async function SuburbPage({ params }: Props) {
  const { state, region, suburb } = await params;
  const locality = getLocality(state, region, suburb);
  if (!locality) notFound();

  const name = displayName(locality.name);
  const regionDef = REGIONS.find((r) => r.slug === locality.regionSlug)!;
  const crumbs = [
    { name: 'Locations', path: '/locations/' },
    { name: state === 'victoria' ? 'Victoria' : 'Queensland', path: `/locations/${state}/` },
    { name: regionDef.name, path: `/locations/${state}/${region}/` },
    { name, path: locality.href },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <Breadcrumbs crumbs={crumbs} />
          <p className="mb-3 text-xs font-semibold uppercase tracking-label text-brand-600">
            {regionDef.name}
          </p>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            Commercial painters in {name}
          </h1>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <Prose>
            {locality.intro ? (
              <p>{locality.intro}</p>
            ) : (
              <p>
                APMG Painting services commercial property in {name} and across{' '}
                {locality.council.name}. We work on offices, retail tenancies, industrial buildings,
                healthcare and education sites, and body corporate common property.
              </p>
            )}
            {locality.localNotes?.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </Prose>

          <div className="mt-10">
            <LocalityFacts locality={locality} />
          </div>
        </Container>
      </Section>

      <CtaBand
        heading={`Commercial painting in ${name}?`}
        body="Tell us what needs doing and we will come and scope it."
        cta={{ label: 'Request a quote', href: '/contact-us/' }}
      />
    </>
  );
}
```

- [ ] **Step 4: Confirm green**

```bash
npx vitest run tests/unit/suburb-page.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -q -m "feat: add suburb pages for all 1,527 localities"
```

---

## Task 11: Region, state and national hubs

**Files:**

- Create: `components/locations/suburb-directory.tsx`, `app/locations/[state]/[region]/page.tsx`, `app/locations/[state]/page.tsx`, `app/locations/page.tsx`
- Test: `tests/unit/location-hubs.test.ts`

**Interfaces:**

- Consumes: Task 8.
- Produces: `<SuburbDirectory localities={...} />`; three route levels; `generateStaticParams` on each.

- [ ] **Step 1: Write the failing test**

`tests/unit/location-hubs.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { generateStaticParams as regionParams } from '@/app/locations/[state]/[region]/page';
import { generateStaticParams as stateParams } from '@/app/locations/[state]/page';
import { REGIONS, allLocalities, localitiesInRegion } from '@/lib/locations';

describe('hub routes', () => {
  it('generates one route per region', async () => {
    expect(await regionParams()).toHaveLength(REGIONS.length);
  });

  it('generates exactly two state routes', async () => {
    const params = await stateParams();
    expect(params.map((p) => p.state).sort()).toEqual(['queensland', 'victoria']);
  });

  it('never generates a region hub with no localities', async () => {
    for (const p of await regionParams()) {
      expect(localitiesInRegion(p.region).length, p.region).toBeGreaterThan(0);
    }
  });

  it('reaches every locality from exactly one region hub', () => {
    const total = REGIONS.reduce((n, r) => n + localitiesInRegion(r.slug).length, 0);
    expect(total).toBe(allLocalities().length);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/location-hubs.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Write the directory component**

`components/locations/suburb-directory.tsx`:

```tsx
import Link from 'next/link';
import type { Locality } from '@/lib/locations';

function displayName(name: string): string {
  return name.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/**
 * Alphabetical suburb directory.
 *
 * Every locality is linked, including Tier 3. They are noindex, so this costs
 * no crawl budget worth protecting, and it is the only way a client can find
 * the page for their own suburb.
 */
export function SuburbDirectory({ localities }: { localities: readonly Locality[] }) {
  const sorted = [...localities].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <ul className="columns-2 gap-8 text-sm sm:columns-3 lg:columns-4">
      {sorted.map((l) => (
        <li key={l.slug} className="break-inside-avoid py-1">
          <Link href={l.href} className="text-ink-700 hover:text-brand-600 hover:underline">
            {displayName(l.name)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Write the three hub routes**

`app/locations/[state]/[region]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { SuburbDirectory } from '@/components/locations/suburb-directory';
import { CtaBand } from '@/components/sections';
import { Container, Lede, Prose, Section, SectionHeading } from '@/components/ui';
import { breadcrumbSchema } from '@/lib/schema';
import { REGIONS, localitiesInRegion, stateSlug } from '@/lib/locations';

export const dynamicParams = false;

export function generateStaticParams() {
  return REGIONS.map((r) => ({ state: stateSlug(r.state), region: r.slug }));
}

type Props = { params: Promise<{ state: string; region: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, region } = await params;
  const def = REGIONS.find((r) => r.slug === region);
  if (!def) return {};
  const count = localitiesInRegion(region).length;

  return buildMetadata({
    title: `Commercial Painters ${def.name} | APMG Painting`,
    description: `Commercial painting across ${def.name} — ${count} suburbs. Offices, retail, industrial, healthcare, education and strata.`,
    path: `/locations/${state}/${region}/`,
    // Region hubs are indexable: they carry real regional content, not a
    // claim of local presence. Rural-fringe hubs are not.
    index: !def.ruralFringe,
  });
}

export default async function RegionPage({ params }: Props) {
  const { state, region } = await params;
  const def = REGIONS.find((r) => r.slug === region && stateSlug(r.state) === state);
  if (!def) notFound();

  const localities = localitiesInRegion(region);
  const crumbs = [
    { name: 'Locations', path: '/locations/' },
    { name: state === 'victoria' ? 'Victoria' : 'Queensland', path: `/locations/${state}/` },
    { name: def.name, path: `/locations/${state}/${region}/` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />
      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <Breadcrumbs crumbs={crumbs} />
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            Commercial painters in {def.name}
          </h1>
          <Lede className="mt-4">
            {localities.length} suburbs across {new Set(localities.map((l) => l.council.name)).size}{' '}
            councils.
          </Lede>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <Prose>
            <p>
              APMG Painting works across {def.name} on commercial property — offices and tenancies,
              retail, industrial and warehouse, healthcare, education, aged care and body corporate
              common property.
            </p>
          </Prose>
          <SectionHeading className="mb-6 mt-12">Suburbs we service</SectionHeading>
          <SuburbDirectory localities={localities} />
        </Container>
      </Section>

      <CtaBand
        heading={`Commercial painting in ${def.name}?`}
        body="Tell us what needs doing and we will come and scope it."
        cta={{ label: 'Request a quote', href: '/contact-us/' }}
      />
    </>
  );
}
```

`app/locations/[state]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CtaBand } from '@/components/sections';
import { Card, Container, Lede, Section, SectionHeading } from '@/components/ui';
import { localitiesInRegion, regionsInState, stateFromSlug, stateSlug } from '@/lib/locations';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ state: stateSlug('VIC') }, { state: stateSlug('QLD') }];
}

type Props = { params: Promise<{ state: string }> };

const STATE_NAMES = { victoria: 'Victoria', queensland: 'Queensland' } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const key = stateFromSlug(state);
  if (!key) return {};
  const name = STATE_NAMES[state as keyof typeof STATE_NAMES];

  return buildMetadata({
    title: `Commercial Painters ${name} | APMG Painting`,
    description: `Commercial painting across ${name}. Offices, retail, industrial, healthcare, education and strata.`,
    path: `/locations/${state}/`,
  });
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const key = stateFromSlug(state);
  if (!key) notFound();

  const name = STATE_NAMES[state as keyof typeof STATE_NAMES];
  const regions = regionsInState(key);
  const total = regions.reduce((n, r) => n + localitiesInRegion(r.slug).length, 0);

  return (
    <>
      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <Breadcrumbs
            crumbs={[
              { name: 'Locations', path: '/locations/' },
              { name, path: `/locations/${state}/` },
            ]}
          />
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            Commercial painters in {name}
          </h1>
          <Lede className="mt-4">
            {total} suburbs across {regions.length} regions.
          </Lede>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <SectionHeading className="mb-6">Regions</SectionHeading>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((r) => (
              <Card key={r.slug}>
                <h3 className="font-display text-xl">
                  <Link href={`/locations/${state}/${r.slug}/`} className="hover:underline">
                    {r.name}
                  </Link>
                </h3>
                <p className="text-ink-600 mt-2 text-sm">
                  {localitiesInRegion(r.slug).length} suburbs
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand
        heading={`Commercial painting in ${name}?`}
        body="Tell us what needs doing and we will come and scope it."
        cta={{ label: 'Request a quote', href: '/contact-us/' }}
      />
    </>
  );
}
```

`app/locations/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { CtaBand } from '@/components/sections';
import { Card, Container, Lede, Section, SectionHeading } from '@/components/ui';
import { allLocalities, localitiesInRegion, regionsInState } from '@/lib/locations';

export const metadata: Metadata = buildMetadata({
  title: 'Where We Work | APMG Painting',
  description:
    'Commercial painting across Victoria and South East Queensland — Melbourne, Brisbane, the Sunshine Coast and the Gold Coast.',
  path: '/locations/',
});

const STATES = [
  {
    slug: 'victoria',
    key: 'VIC',
    name: 'Victoria',
    blurb: 'Metropolitan Melbourne, from our Bayswater North base.',
  },
  {
    slug: 'queensland',
    key: 'QLD',
    name: 'Queensland',
    blurb: 'Brisbane, the Sunshine Coast and the Gold Coast.',
  },
] as const;

export default function LocationsPage() {
  return (
    <>
      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Where we work</h1>
          <Lede className="mt-4">{allLocalities().length} suburbs across two states.</Lede>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <SectionHeading className="mb-6">States</SectionHeading>
          <div className="grid gap-6 sm:grid-cols-2">
            {STATES.map((s) => {
              const regions = regionsInState(s.key);
              const total = regions.reduce((n, r) => n + localitiesInRegion(r.slug).length, 0);
              return (
                <Card key={s.slug}>
                  <h2 className="font-display text-2xl">
                    <Link href={`/locations/${s.slug}/`} className="hover:underline">
                      {s.name}
                    </Link>
                  </h2>
                  <p className="text-ink-600 mt-2 text-sm">{s.blurb}</p>
                  <p className="text-ink-500 mt-3 text-sm">
                    {total} suburbs · {regions.length} regions
                  </p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <CtaBand
        heading="Not sure if we cover your site?"
        body="Tell us where it is and we will tell you straight away."
        cta={{ label: 'Request a quote', href: '/contact-us/' }}
      />
    </>
  );
}
```

- [ ] **Step 5: Confirm green**

```bash
npx vitest run tests/unit/location-hubs.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -q -m "feat: add national, state and region location hubs"
```

---

## Task 12: Sitemap and navigation

**Files:**

- Modify: `app/sitemap.ts`, `components/navigation/nav-data.ts`
- Test: `tests/unit/sitemap.test.ts`

**Interfaces:**

- Consumes: Tasks 8, 11.
- Produces: a sitemap containing only indexable URLs; nav with a Locations entry and no residential column.

- [ ] **Step 1: Write the failing test**

`tests/unit/sitemap.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadSitemap() {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SANDBOX = 'false';
  const mod = await import('@/app/sitemap');
  return mod.default();
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SANDBOX;
  vi.resetModules();
});

describe('sitemap', () => {
  it('excludes every noindex locality', async () => {
    const { allLocalities } = await import('@/lib/locations');
    const urls = new Set((await loadSitemap()).map((e) => e.url));
    for (const l of allLocalities().filter((x) => !x.indexable)) {
      expect(
        [...urls].some((u) => u.endsWith(l.href)),
        l.name,
      ).toBe(false);
    }
  });

  it('includes every indexable locality', async () => {
    const { indexableLocalities } = await import('@/lib/locations');
    const urls = (await loadSitemap()).map((e) => e.url);
    for (const l of indexableLocalities()) {
      expect(
        urls.some((u) => u.endsWith(l.href)),
        l.name,
      ).toBe(true);
    }
  });

  it('excludes rural-fringe region hubs', async () => {
    const urls = (await loadSitemap()).map((e) => e.url);
    expect(urls.some((u) => u.includes('yarra-valley-and-hinterland'))).toBe(false);
    expect(urls.some((u) => u.includes('seq-hinterland'))).toBe(false);
  });

  it('includes both state hubs and the non-fringe region hubs', async () => {
    const { REGIONS } = await import('@/lib/locations');
    const urls = (await loadSitemap()).map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/locations/victoria/'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/locations/queensland/'))).toBe(true);
    for (const r of REGIONS.filter((x) => !x.ruralFringe)) {
      expect(
        urls.some((u) => u.includes(`/${r.slug}/`)),
        r.slug,
      ).toBe(true);
    }
  });

  it('has no residential URL', async () => {
    const urls = (await loadSitemap()).map((e) => e.url);
    expect(urls.filter((u) => /residential|house-painting/.test(u))).toEqual([]);
  });

  it('has no duplicate URLs', async () => {
    const urls = (await loadSitemap()).map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/sitemap.test.ts
```

Expected: FAIL — the sitemap still imports `@/content/locations`.

- [ ] **Step 3: Rewrite the sitemap**

`app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { sectors } from '@/content/sectors';
import { projects } from '@/content/projects';
import { REGIONS, indexableLocalities, stateSlug } from '@/lib/locations';

/**
 * Sitemap.
 *
 * Indexable URLs only. Listing a noindex URL sends Google two contradictory
 * instructions, and with ~1,462 Tier 3 suburb pages that mistake would be the
 * dominant signal the site sends.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const buildDate = new Date();

  const staticPaths: { path: string; priority: number }[] = [
    { path: '/', priority: 1 },
    { path: '/commercial/', priority: 0.9 },
    { path: '/locations/', priority: 0.8 },
    { path: '/projects/', priority: 0.8 },
    { path: '/contact-us/', priority: 0.7 },
    { path: '/about-us/', priority: 0.5 },
  ];

  return [
    ...staticPaths.map((e) => ({
      url: `${siteUrl}${e.path}`,
      lastModified: buildDate,
      changeFrequency: 'monthly' as const,
      priority: e.priority,
    })),
    ...sectors.map((s) => ({
      url: `${siteUrl}${s.legacyPath}`,
      lastModified: buildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...projects.map((p) => ({
      url: `${siteUrl}/projects/${p.slug}/`,
      lastModified: buildDate,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
    // State hubs.
    ...(['VIC', 'QLD'] as const).map((s) => ({
      url: `${siteUrl}/locations/${stateSlug(s)}/`,
      lastModified: buildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // Region hubs, minus the rural-fringe ones, which are noindex.
    ...REGIONS.filter((r) => !r.ruralFringe).map((r) => ({
      url: `${siteUrl}/locations/${stateSlug(r.state)}/${r.slug}/`,
      lastModified: buildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // Tier 1 suburbs only.
    ...indexableLocalities().map((l) => ({
      url: `${siteUrl}${l.href}`,
      lastModified: buildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
```

- [ ] **Step 4: Update navigation**

In `components/navigation/nav-data.ts`, replace `mainNav` and `footerNav`:

```ts
export const mainNav: readonly NavItem[] = [
  {
    label: 'Commercial',
    href: '/commercial/',
    children: [
      { label: 'Commercial painting', href: '/commercial/', description: 'Overview' },
      ...sectors.map((s) => ({ label: s.shortTitle, href: s.legacyPath })),
    ],
  },
  {
    label: 'Locations',
    href: '/locations/',
    children: [
      { label: 'Victoria', href: '/locations/victoria/' },
      { label: 'Queensland', href: '/locations/queensland/' },
    ],
  },
  { label: 'Projects', href: '/projects/' },
  { label: 'About', href: '/about-us/' },
  { label: 'Contact', href: '/contact-us/' },
] as const;

export const footerNav = {
  commercial: [
    { label: 'Commercial painting', href: '/commercial/' },
    ...sectors.map((s) => ({ label: s.shortTitle, href: s.legacyPath })),
  ],
  locations: [
    { label: 'Where we work', href: '/locations/' },
    { label: 'Victoria', href: '/locations/victoria/' },
    { label: 'Queensland', href: '/locations/queensland/' },
  ],
  company: [
    { label: 'About us', href: '/about-us/' },
    { label: 'Projects', href: '/projects/' },
    { label: 'Contact us', href: '/contact-us/' },
  ],
} as const;
```

Then fix `components/layout/footer.tsx`, which references `footerNav.residential`.

- [ ] **Step 5: Confirm green**

```bash
npx vitest run tests/unit/sitemap.test.ts && npm run typecheck
```

Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -q -m "feat: rebuild sitemap and navigation around the location tree"
```

---

## Task 13: Service-area schema

**Files:**

- Modify: `lib/schema/index.ts`
- Test: `tests/unit/schema-service-area.test.ts`

**Interfaces:**

- Consumes: `qldPresence`, `ANCHORS`.
- Produces: `localBusinessSchema()` emitting `areaServed` as a `GeoCircle` for VIC plus three `AdministrativeArea` entries for QLD.

- [ ] **Step 1: Write the failing test**

`tests/unit/schema-service-area.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { localBusinessSchema, organizationSchema } from '@/lib/schema';
import { qldPresence } from '@/content/locations.overrides';

const lb = localBusinessSchema() as Record<string, unknown>;

describe('LocalBusiness', () => {
  it('emits exactly one entity', () => {
    expect(Array.isArray(lb)).toBe(false);
    expect(lb['@type']).toBeTruthy();
  });

  it('names the three Queensland regions as areaServed', () => {
    const served = lb.areaServed as Array<Record<string, unknown>>;
    const names = served.map((a) => a.name).filter(Boolean);
    expect(names).toEqual(expect.arrayContaining(['Brisbane', 'Sunshine Coast', 'Gold Coast']));
  });

  it('emits a GeoCircle for the Victorian radius', () => {
    const served = lb.areaServed as Array<Record<string, unknown>>;
    const circle = served.find((a) => a['@type'] === 'GeoCircle');
    expect(circle).toBeDefined();
    expect(circle!.geoRadius).toBe('50000');
  });

  it('does not claim a Queensland address while qldPresence is false', () => {
    expect(qldPresence).toBe(false);
    expect(JSON.stringify(lb)).not.toMatch(/QLD|Queensland,/);
    const address = lb.address as Record<string, unknown> | undefined;
    expect(address?.addressRegion).toBe('VIC');
  });

  it('emits no AggregateRating anywhere', () => {
    const blob = JSON.stringify(lb) + JSON.stringify(organizationSchema());
    expect(blob).not.toMatch(/aggregateRating/i);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run tests/unit/schema-service-area.test.ts
```

Expected: FAIL on the `areaServed` assertions.

- [ ] **Step 3: Implement**

In `lib/schema/index.ts`, inside `localBusinessSchema()`, replace the existing `areaServed` value:

```ts
import { ANCHORS } from '@/lib/geo/anchors';

/**
 * Service area.
 *
 * A GeoCircle for Victoria, because the radius around the Bayswater North base
 * is a real, evidenced claim. Queensland is three named AdministrativeAreas
 * and nothing more: with no QLD address there is no second LocalBusiness and
 * no GeoCircle to anchor (spec §9). Naming a region we service is true;
 * drawing a circle around a place we do not operate from is not.
 */
function areaServed() {
  const vic = ANCHORS.find((a) => a.key === 'bayswater-north')!;
  return [
    {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: vic.coords.lat,
        longitude: vic.coords.lng,
      },
      geoRadius: String(vic.radiusKm * 1000),
    },
    ...ANCHORS.filter((a) => a.state === 'QLD').map((a) => ({
      '@type': 'AdministrativeArea',
      name: a.label,
      containedInPlace: { '@type': 'State', name: 'Queensland' },
    })),
  ];
}
```

and set `areaServed: areaServed()` in the returned object.

- [ ] **Step 4: Confirm green**

```bash
npx vitest run tests/unit/schema-service-area.test.ts && npm run verify
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -q -m "feat: emit VIC GeoCircle and named QLD service areas"
```

---

## Task 14: Queensland copy discipline test

**Files:**

- Test: `tests/unit/qld-copy-discipline.test.ts`

**Interfaces:**

- Consumes: everything.
- Produces: nothing. This is a guard.

Spec §9 is the constraint most likely to erode. A future edit adding "our Brisbane team" to a hub page would be honest-looking, wrong, and invisible in review. This makes it a build failure.

- [ ] **Step 1: Write the test**

`tests/unit/qld-copy-discipline.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { COUNCILS } from '@/content/councils';
import { allLocalities } from '@/lib/locations';
import { qldPresence } from '@/content/locations.overrides';

const BANNED = [
  /\bbased in (?:brisbane|queensland|the gold coast|the sunshine coast)/i,
  /\bour (?:brisbane|gold coast|sunshine coast|queensland) (?:team|office|branch|crew)/i,
  /\blocal to (?:brisbane|the gold coast|the sunshine coast)/i,
  /\bqueensland office\b/i,
];

describe('Queensland copy discipline', () => {
  it('is only enforced while qldPresence is false', () => {
    // If this fails, QLD presence became real. Revisit the rule deliberately
    // rather than deleting this file.
    expect(qldPresence).toBe(false);
  });

  it('has no banned phrase in Queensland council notes', () => {
    for (const c of COUNCILS.filter((x) => x.state === 'QLD')) {
      const text = `${c.buildingStock} ${c.note}`;
      for (const re of BANNED) {
        expect(re.test(text), `${c.name}: ${re}`).toBe(false);
      }
    }
  });

  it('has no banned phrase in Queensland locality overrides', () => {
    for (const l of allLocalities().filter((x) => x.state === 'QLD')) {
      const text = `${l.intro ?? ''} ${(l.localNotes ?? []).join(' ')}`;
      for (const re of BANNED) {
        expect(re.test(text), `${l.name}: ${re}`).toBe(false);
      }
    }
  });

  it('has no banned phrase in any location route source', () => {
    const files = globSync('app/locations/**/*.tsx', { cwd: process.cwd() });
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const re of BANNED) {
        expect(re.test(src), `${f}: ${re}`).toBe(false);
      }
    }
  });
});
```

- [ ] **Step 2: Run it**

```bash
npx vitest run tests/unit/qld-copy-discipline.test.ts
```

Expected: PASS. If it fails, the offending copy is wrong — fix the copy, not the test.

- [ ] **Step 3: Prove the guard actually catches something**

Temporarily add `note: 'Our Brisbane team works across...'` to one QLD council and re-run. It must fail. Then revert.

```bash
npx vitest run tests/unit/qld-copy-discipline.test.ts
git checkout content/councils.ts
```

A guard nobody has seen fail is a guard nobody knows works.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/qld-copy-discipline.test.ts
git commit -q -m "test: fail the build on any claim of Queensland local presence"
```

---

## Task 15: Full build and E2E

**Files:**

- Modify: `tests/e2e/critical-flows.spec.ts`
- Test: the whole suite

**Interfaces:**

- Consumes: all prior tasks.
- Produces: a green `npm run verify` and a measured build time for 1,527 static pages.

- [ ] **Step 1: Run the production build and record the numbers**

```bash
echo "build.log" >> .gitignore
time npm run build 2>&1 | tee build.log
grep -cE "^\s*[├└]?\s*●|/locations/" build.log
```

Expected: build succeeds; ≥ 1,527 location routes prerendered.

Record wall-clock time. Spec §15 flags build time as a risk: if it exceeds roughly 10 minutes, stop and raise it rather than pressing on — the mitigation is moving Tier 3 to on-demand ISR, and that is a design change, not a tweak.

- [ ] **Step 2: Write the E2E navigation test**

Replace the location portion of `tests/e2e/critical-flows.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('navigates national -> state -> region -> suburb', async ({ page }) => {
  await page.goto('/locations/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Where we work');

  await page.getByRole('link', { name: 'Victoria', exact: true }).first().click();
  await expect(page).toHaveURL(/\/locations\/victoria\/$/);

  await page.getByRole('link', { name: 'Eastern Melbourne' }).first().click();
  await expect(page).toHaveURL(/\/locations\/victoria\/eastern\/$/);

  await page.getByRole('link', { name: 'Chirnside Park' }).first().click();
  await expect(page).toHaveURL(/\/locations\/victoria\/eastern\/chirnside-park\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Commercial painters in Chirnside Park',
  );
});

test('every page is noindex in sandbox mode', async ({ page }) => {
  const response = await page.goto('/locations/victoria/eastern/chirnside-park/');
  expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('robots.txt blocks everything in sandbox mode', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(await res.text()).toContain('Disallow: /');
});

test('a Tier 3 suburb page renders and is noindex', async ({ page }) => {
  const response = await page.goto('/locations/queensland/gold-coast/southport/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Southport');
});
```

- [ ] **Step 3: Run the E2E suite**

```bash
npx playwright test
```

Expected: PASS. If a link name is ambiguous, tighten the locator rather than loosening the assertion.

- [ ] **Step 4: Run the whole verification chain**

```bash
npm run verify && npx playwright test
```

Expected: lint, typecheck, format, unit and build all PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -q -m "test: cover location navigation and sandbox lockdown end to end"
```

- [ ] **Step 6: Record what shipped**

Append to `docs/CLIENT-BRIEF.md` under a new heading `## 8. Location coverage`:

- 1,527 suburb pages exist across VIC and QLD
- ~72 are indexable at launch (22 region hubs minus 2 fringe, plus 15 Tier 1 VIC suburbs); the rest are noindex pending evidence
- No Queensland page is indexable until APMG supplies a QLD address or a documented QLD project
- The Tier 1 seed list needs APMG's confirmation that those are the precincts worth targeting

```bash
git add docs/CLIENT-BRIEF.md
git commit -q -m "docs: record location coverage and what unlocks each tier"
```

---

## Self-Review

**Spec coverage**

| Spec section                        | Task                                             |
| ----------------------------------- | ------------------------------------------------ |
| §2 goals 1, 5                       | 2, 14                                            |
| §3 non-goals                        | 2 (residential), plan scope (no sector × suburb) |
| §5 anchors, filter chain            | 4, 6                                             |
| §5.1 bad data, sanity check         | 5, 6                                             |
| §5.2 rural fringe, urban allowlists | 5                                                |
| §6 information architecture         | 10, 11, 12                                       |
| §6.1 22 regions, Brisbane split     | 5                                                |
| §7 tiers, indexability              | 6, 8, 12                                         |
| §8 six facts                        | 7, 9                                             |
| §8.1 generator pipeline             | 6                                                |
| §9 QLD honesty                      | 8, 13, 14                                        |
| §10 structured data                 | 13                                               |
| §11 four-layer lockdown             | 3, 15                                            |
| §12 SEO improvements                | 12, 13                                           |
| §13 content inventory               | 2, 6, 8, 12                                      |
| §14 testing                         | every task                                       |
| §15 build-time risk                 | 15                                               |
| §16 client brief                    | 15                                               |
| §17 phases 1–3                      | this plan                                        |

Not covered here, by design: §10's `Service` and `FAQPage` schema on service and sector pages, and §12's internal-linking matrix — both are phase 4/5 work.

**Deferred to later plans:** phase 4 (B2B re-pitch, sector × region linking matrix), phase 5 (Tier 1 hand-written content, `llms.txt` extension), phase 6 (176 sector × region pages).
