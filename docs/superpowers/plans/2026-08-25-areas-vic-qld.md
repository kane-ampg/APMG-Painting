# `/areas/` VIC + QLD Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `/areas/` from 7 flat suburb pages to 1,465 pages covering every locality inside four service radii — Bayswater North 50km, Brisbane CBD 40km, Southport 40km, Maroochydore 40km — nested state → region → suburb, with only 41 of them indexable.

**Architecture:** A committed generated dataset (`content/locations.generated.json`, 1,440 localities) produced by an offline script from a third-party postcode dataset, merged at import time with hand-authored per-council and per-suburb copy. Routes are four nested levels of Server Components with `generateStaticParams`. Indexability is computed from `tier` at read time, never stored, so it cannot drift.

**Tech Stack:** Next.js 16.3.2 (App Router, `trailingSlash: true`), React 19, TypeScript 5.7 (`strict`, `noUncheckedIndexedAccess`), Tailwind 3.4, Vitest 4, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-25-apmg-painting-areas-vic-qld-design.md`

**Source repo for ports:** `C:/Users/Kane/Desktop/APMG-Commercial` — referred to below as `$SRC`. Set it once per shell:

```bash
SRC=/c/Users/Kane/Desktop/APMG-Commercial
```

## Global Constraints

- **Anchors are used verbatim, never rounded.** Bayswater North −37.845116, 145.270141 / 50km. Brisbane CBD −27.4698, 153.0251 / 40km. Southport −27.9680, 153.4000 / 40km. Maroochydore −26.6600, 153.0930 / 40km.
- **`EXPECTED_TOTAL = 1440`.** The generator fails the build if the pipeline stops matching. Changing this number is a decision, not a fix.
- **41 indexable pages:** 1 national hub + 2 state hubs + 22 region hubs + 16 Tier 1 suburbs. Everything else is `noindex,follow` and absent from the sitemap.
- **`indexable = tier === 1 && !ruralFringe && (state === 'VIC' || qldPresence)`** — one rule, computed at read time in `lib/locations/index.ts`, never stored in the generated JSON.
- **`qldPresence` is `false`.** No QLD locality is indexable. No second `LocalBusiness`. No QLD page may contain "based in", "our Brisbane", or "local to" — enforced by a test in Task 11.
- **`noindex,follow`, never `noindex,nofollow`,** on Tier 3 pages. They must still be traversable to the hubs they link to.
- **Never list a `noindex` URL in the sitemap.** Two contradictory instructions to Google.
- **`AggregateRating` is not emitted.** No first-party verified reviews exist.
- **TypeScript is `strict` with `noUncheckedIndexedAccess`.** Every array index and `Record` lookup yields `T | undefined` and must be narrowed. This is the single most common cause of a failing `npm run typecheck` in this repo.
- **`trailingSlash: true`.** Every internal href ends in `/`.
- Verify with `npm run verify` (lint → typecheck → format:check → test → build). `npm run format:check` currently reports 3 pre-existing failures — `app/page.tsx`, `README.md`, `scripts/sort-legacy-suburbs.mjs`. Do not fix them in this work and do not let them mask a new one.

---

### Task 1: Make the sandbox `X-Robots-Tag` conditional

The launch-blocking defect from spec §10.1, independent of everything else in this plan. `next.config.ts` sets `X-Robots-Tag: noindex, nofollow` on `/:path*` unconditionally while the other three lockdown layers key off `isSandbox`. At go-live, releasing the other three would leave this header returning `noindex` — and a header-level `noindex` overrides everything, with no visible symptom on the page.

**Files:**

- Modify: `next.config.ts:26-33`
- Test: `tests/unit/sandbox-lockdown.test.ts` (create)

**Interfaces:**

- Consumes: `isSandbox` from `@/lib/site` (existing: `process.env.NEXT_PUBLIC_SANDBOX !== 'false'`)
- Produces: nothing later tasks depend on.

`next.config.ts` computes the predicate inline rather than importing `lib/site.ts`. Next's config loader does not apply the `@/*` tsconfig path mapping, and a relative import into the app's module graph from the config is avoidable risk. The test below pins the two definitions together so they cannot drift.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/sandbox-lockdown.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The four sandbox noindex layers must switch together.
 *
 * Layer 4 — the X-Robots-Tag response header — was unconditional. It is the
 * only layer that covers non-HTML responses, and it is also the only layer
 * whose failure is invisible: at go-live, releasing layers 1-3 while this one
 * kept returning noindex would launch the site permanently unindexable with
 * nothing wrong on the page itself. These tests assert all four move as one.
 */

type HeaderEntry = { source: string; headers: { key: string; value: string }[] };

async function robotsHeaders(sandbox: string | undefined): Promise<HeaderEntry[]> {
  vi.resetModules();
  if (sandbox === undefined) {
    delete process.env.NEXT_PUBLIC_SANDBOX;
  } else {
    process.env.NEXT_PUBLIC_SANDBOX = sandbox;
  }

  const config = (await import('../../next.config')).default;
  const headers = (await config.headers?.()) ?? [];
  return (headers as HeaderEntry[]).filter((entry) =>
    entry.headers.some((h) => h.key === 'X-Robots-Tag'),
  );
}

const original = process.env.NEXT_PUBLIC_SANDBOX;

afterEach(() => {
  if (original === undefined) {
    delete process.env.NEXT_PUBLIC_SANDBOX;
  } else {
    process.env.NEXT_PUBLIC_SANDBOX = original;
  }
  vi.resetModules();
});

describe('X-Robots-Tag is conditional on the sandbox flag', () => {
  it('is present when NEXT_PUBLIC_SANDBOX is unset', async () => {
    const entries = await robotsHeaders(undefined);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.headers[0]?.value).toBe('noindex, nofollow');
  });

  it('is present when NEXT_PUBLIC_SANDBOX is any value other than "false"', async () => {
    const entries = await robotsHeaders('true');
    expect(entries).toHaveLength(1);
  });

  it('is ABSENT when NEXT_PUBLIC_SANDBOX is exactly "false"', async () => {
    const entries = await robotsHeaders('false');
    expect(entries).toHaveLength(0);
  });
});

describe('the config predicate agrees with lib/site.ts', () => {
  it.each([
    [undefined, true],
    ['true', true],
    ['false', false],
  ])('NEXT_PUBLIC_SANDBOX=%s -> isSandbox %s', async (value, expected) => {
    vi.resetModules();
    if (value === undefined) {
      delete process.env.NEXT_PUBLIC_SANDBOX;
    } else {
      process.env.NEXT_PUBLIC_SANDBOX = value;
    }

    const { isSandbox } = await import('../../lib/site');
    expect(isSandbox).toBe(expected);

    const entries = await robotsHeaders(value);
    expect(entries.length > 0).toBe(expected);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/sandbox-lockdown.test.ts
```

Expected: the third test in the first block FAILS — `expected length 0, received 1`, because the header is currently unconditional. The other tests pass.

- [ ] **Step 3: Make the header conditional**

In `next.config.ts`, add above `const nextConfig`:

```ts
/**
 * Sandbox guard, duplicated from lib/site.ts on purpose.
 *
 * Next's config loader does not apply the `@/*` tsconfig path mapping, and
 * reaching into the app's module graph from the config is avoidable risk for a
 * one-line predicate. tests/unit/sandbox-lockdown.test.ts asserts this and
 * lib/site.ts's `isSandbox` agree for every value, so they cannot drift.
 */
const isSandbox = process.env.NEXT_PUBLIC_SANDBOX !== 'false';
```

Replace the `headers()` body with:

```ts
  async headers() {
    /*
     * Layer 4 of the sandbox lockdown, and the only one covering non-HTML
     * responses — images, the OG image route, llms.txt.
     *
     * Conditional, not unconditional. A header-level noindex overrides the
     * meta tag and robots.txt, so leaving this on at go-live would make the
     * site permanently unindexable while every page looked correct. All four
     * layers key off the same value and release together.
     */
    if (!isSandbox) return [];

    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/unit/sandbox-lockdown.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts tests/unit/sandbox-lockdown.test.ts
git commit -m "Make sandbox X-Robots-Tag conditional so all four noindex layers release together"
```

---

### Task 2: Geo primitives

**Files:**

- Create: `lib/geo/haversine.ts`
- Create: `lib/geo/anchors.ts`
- Test: `tests/unit/geo.test.ts`

**Interfaces:**

- Produces:
  - `type Coords = { lat: number; lng: number }`
  - `distanceKm(a: Coords, b: Coords): number`
  - `bearingDeg(from: Coords, to: Coords): number`
  - `type StateKey = 'VIC' | 'QLD'`
  - `type AnchorKey = 'bayswater-north' | 'brisbane' | 'southport' | 'maroochydore'`
  - `type Anchor = { key: AnchorKey; label: string; state: StateKey; coords: Coords; radiusKm: number }`
  - `ANCHORS: readonly Anchor[]`
  - `nearestAnchor(c: Coords, state: StateKey): { anchor: Anchor; distanceKm: number } | null`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/geo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { bearingDeg, distanceKm } from '@/lib/geo/haversine';
import { ANCHORS, nearestAnchor } from '@/lib/geo/anchors';

const BAYSWATER_NORTH = { lat: -37.845116, lng: 145.270141 };
const MELBOURNE_CBD = { lat: -37.8136, lng: 144.9631 };
const BRISBANE_CBD = { lat: -27.4698, lng: 153.0251 };

describe('distanceKm', () => {
  it('is zero for a point against itself', () => {
    expect(distanceKm(BAYSWATER_NORTH, BAYSWATER_NORTH)).toBeCloseTo(0, 6);
  });

  it('is symmetric', () => {
    expect(distanceKm(BAYSWATER_NORTH, MELBOURNE_CBD)).toBeCloseTo(
      distanceKm(MELBOURNE_CBD, BAYSWATER_NORTH),
      9,
    );
  });

  it('measures Bayswater North to the Melbourne CBD at about 27km', () => {
    expect(distanceKm(BAYSWATER_NORTH, MELBOURNE_CBD)).toBeGreaterThan(26);
    expect(distanceKm(BAYSWATER_NORTH, MELBOURNE_CBD)).toBeLessThan(29);
  });

  it('measures Melbourne to Brisbane at about 1370km', () => {
    expect(distanceKm(MELBOURNE_CBD, BRISBANE_CBD)).toBeGreaterThan(1300);
    expect(distanceKm(MELBOURNE_CBD, BRISBANE_CBD)).toBeLessThan(1450);
  });
});

describe('bearingDeg', () => {
  it('reports north as 0', () => {
    expect(bearingDeg({ lat: -27, lng: 153 }, { lat: -26, lng: 153 })).toBeCloseTo(0, 3);
  });

  it('reports east as 90', () => {
    expect(bearingDeg({ lat: 0, lng: 153 }, { lat: 0, lng: 154 })).toBeCloseTo(90, 3);
  });

  it('reports south as 180', () => {
    expect(bearingDeg({ lat: -26, lng: 153 }, { lat: -27, lng: 153 })).toBeCloseTo(180, 3);
  });

  it('always returns 0-360, never negative', () => {
    const west = bearingDeg({ lat: 0, lng: 153 }, { lat: 0, lng: 152 });
    expect(west).toBeGreaterThanOrEqual(0);
    expect(west).toBeLessThan(360);
    expect(west).toBeCloseTo(270, 3);
  });
});

describe('ANCHORS', () => {
  it('holds exactly the four the spec names', () => {
    expect(ANCHORS.map((a) => a.key)).toEqual([
      'bayswater-north',
      'brisbane',
      'southport',
      'maroochydore',
    ]);
  });

  it('carries the coordinates unrounded', () => {
    const vic = ANCHORS.find((a) => a.key === 'bayswater-north');
    expect(vic?.coords).toEqual({ lat: -37.845116, lng: 145.270141 });
  });

  it('uses 50km for Victoria and 40km for the three Queensland anchors', () => {
    for (const anchor of ANCHORS) {
      expect(anchor.radiusKm).toBe(anchor.state === 'VIC' ? 50 : 40);
    }
  });
});

describe('nearestAnchor', () => {
  it('assigns a Melbourne suburb to Bayswater North', () => {
    expect(nearestAnchor(MELBOURNE_CBD, 'VIC')?.anchor.key).toBe('bayswater-north');
  });

  it('returns null outside every radius', () => {
    // Bendigo — well inside Victoria, well outside 50km of Bayswater North.
    expect(nearestAnchor({ lat: -36.757, lng: 144.2794 }, 'VIC')).toBeNull();
  });

  it('never assigns across a state line', () => {
    // Brisbane's coordinates, asked for as if Victorian: no VIC anchor covers it.
    expect(nearestAnchor(BRISBANE_CBD, 'VIC')).toBeNull();
  });

  it('picks the nearer of two overlapping radii', () => {
    // Caboolture sits inside both Brisbane's and the Sunshine Coast's 40km.
    const caboolture = { lat: -27.0839, lng: 152.9508 };
    const result = nearestAnchor(caboolture, 'QLD');
    expect(result?.anchor.key).toBe('brisbane');
  });

  it('reports the distance it measured', () => {
    const result = nearestAnchor(MELBOURNE_CBD, 'VIC');
    expect(result?.distanceKm).toBeCloseTo(distanceKm(BAYSWATER_NORTH, MELBOURNE_CBD), 6);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/geo.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/geo/haversine"`.

- [ ] **Step 3: Port the two modules**

```bash
mkdir -p lib/geo
cp "$SRC/lib/geo/haversine.ts" lib/geo/haversine.ts
cp "$SRC/lib/geo/anchors.ts" lib/geo/anchors.ts
```

Neither file contains a `/locations/` string, so no retargeting is needed. Confirm:

```bash
grep -n "/locations/" lib/geo/*.ts || echo "clean"
```

Expected: `clean`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run tests/unit/geo.test.ts && npm run typecheck
```

Expected: PASS (18 tests), typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/geo tests/unit/geo.test.ts
git commit -m "Add haversine distance, bearing and the four service-radius anchors"
```

---

### Task 3: Region model

22 regions. Brisbane City Council is 307 localities in one LGA, so it splits by bearing from the CBD; every other council maps directly or joins a hinterland region.

**Files:**

- Create: `lib/locations/types.ts`
- Create: `lib/locations/regions.ts`
- Test: `tests/unit/regions.test.ts`

**Interfaces:**

- Consumes: `Coords`, `StateKey` from `@/lib/geo/anchors`; `distanceKm`, `bearingDeg` from `@/lib/geo/haversine`
- Produces:
  - `type Tier = 1 | 3`
  - `type RegionDef = { slug: string; name: string; state: StateKey; councils: readonly string[]; ruralFringe: boolean }`
  - `type GeneratedLocality` — the record shape written to the generated JSON: `{ slug, name, state, postcodes, coords, council, anchorKey, distanceKm, regionSlug, ruralFringe, tier, neighbourHrefs }`
  - `REGIONS: readonly RegionDef[]` (22 entries)
  - `resolveRegion(...)`, `isRuralFringe(...)`, `IMPOSSIBLE_COUNCILS`, `SINGLE_LOCALITY_COUNCIL_ALLOWLIST`

- [ ] **Step 1: Port the two modules first, then read them**

`regions.ts` is 288 lines of committed policy — region definitions, the bearing split, the urban allowlists for Cardinia and Yarra Ranges, and the impossible-council drops. Porting before writing tests is correct here: the tests assert the policy the file encodes, and inventing a different policy in a test would just fight the spec.

```bash
mkdir -p lib/locations
cp "$SRC/lib/locations/types.ts" lib/locations/types.ts
cp "$SRC/lib/locations/regions.ts" lib/locations/regions.ts
```

Retarget the one URL reference in the `types.ts` doc comment (line 38) — it describes `neighbourHrefs`:

```bash
sed -i 's#`/locations/{state}/{region}/{suburb}/`#`/areas/{state}/{region}/{suburb}/`#' lib/locations/types.ts
grep -n "areas" lib/locations/types.ts
```

`regions.ts` line 284's mention of `lib/locations/regions.ts` is a self-reference in an error message and is correct as-is.

Read both files before writing the test, and confirm the exported names match the Interfaces block above:

```bash
grep -n "^export" lib/locations/types.ts lib/locations/regions.ts
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/regions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { REGIONS, isRuralFringe, resolveRegion } from '@/lib/locations/regions';

/**
 * The region model, spec §4.2.
 *
 * 22 hubs. Every locality must land in exactly one, and the assignment has to
 * be reproducible from the data — a locality whose region depends on which
 * order the dataset happened to arrive in would move URL between builds.
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

  it('names no council in two regions of the same state', () => {
    for (const state of ['VIC', 'QLD'] as const) {
      const seen = new Map<string, string>();
      for (const region of REGIONS.filter((r) => r.state === state)) {
        for (const council of region.councils) {
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
    expect(resolveRegion({ council: 'Brisbane', state: 'QLD', coords })).toBe(expected);
  });

  it('takes the inner ring first, regardless of bearing', () => {
    // 2km due south of the CBD is inner, not brisbane-south.
    expect(
      resolveRegion({ council: 'Brisbane', state: 'QLD', coords: { lat: -27.488, lng: 153.0251 } }),
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
```

- [ ] **Step 3: Run the test**

```bash
npx vitest run tests/unit/regions.test.ts
```

Expected: PASS. If any assertion fails, the ported `regions.ts` disagrees with the spec — read the failure, reconcile against spec §4.2, and fix `regions.ts`, not the test. If `resolveRegion` or `isRuralFringe` take different argument shapes than assumed above, adjust the test calls to the real signatures found in Step 1 and keep the assertions.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/locations tests/unit/regions.test.ts
git commit -m "Add the 22-region model, bearing split and rural-fringe rules"
```

---

### Task 4: Council notes

45 hand-authored council entries. This is the leverage that makes 1,440 differentiated pages affordable — 45 pieces of real writing rather than 1,440 name-swapped templates.

**Files:**

- Create: `content/councils.ts`
- Test: `tests/unit/councils.test.ts`

**Interfaces:**

- Consumes: `StateKey` from `@/lib/locations/types`
- Produces:
  - `type Council = { name: string; state: StateKey; buildingStock: string; note: string }`
  - `COUNCILS: readonly Council[]` (45 entries)
  - `getCouncil(name: string): Council | undefined`

- [ ] **Step 1: Port the file**

```bash
cp "$SRC/content/councils.ts" content/councils.ts
grep -c "^    name: '" content/councils.ts
```

Expected: `45`. The file's only import is `@/lib/locations/types`, which Task 3 created.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/councils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { COUNCILS, getCouncil } from '@/content/councils';

/**
 * Council notes.
 *
 * Two editorial rules from spec §6, both testable:
 *
 * 1. No claimed presence in Queensland. APMG has no Queensland address,
 *    projects or phone number, so a QLD note may describe the place and how
 *    work is scoped there but never a footprint in it.
 * 2. Real writing, not a filled-in template. A note short enough to be a
 *    label is not differentiation.
 */

const PRESENCE_CLAIMS = [
  'based in',
  'our brisbane',
  'our gold coast',
  'our sunshine coast',
  'local to',
  'our team in',
  'our office in',
  'we are located',
];

describe('COUNCILS', () => {
  it('holds 45 councils', () => {
    expect(COUNCILS).toHaveLength(45);
  });

  it('has no duplicate names', () => {
    const names = COUNCILS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('resolves by exact name and rejects an unknown one', () => {
    expect(getCouncil('Brisbane')?.state).toBe('QLD');
    expect(getCouncil('Maroondah')?.state).toBe('VIC');
    expect(getCouncil('Not A Council')).toBeUndefined();
  });
});

describe('every council carries real writing', () => {
  it.each(COUNCILS.map((c) => [c.name, c] as const))('%s', (_name, council) => {
    expect(council.buildingStock.length).toBeGreaterThan(80);
    expect(council.note.length).toBeGreaterThan(120);
    expect(council.buildingStock).not.toBe(council.note);
  });
});

describe('no Queensland council note claims a presence', () => {
  it.each(COUNCILS.filter((c) => c.state === 'QLD').map((c) => [c.name, c] as const))(
    '%s',
    (name, council) => {
      const text = `${council.buildingStock} ${council.note}`.toLowerCase();
      for (const claim of PRESENCE_CLAIMS) {
        expect(text, `${name} claims "${claim}"`).not.toContain(claim);
      }
    },
  );
});
```

- [ ] **Step 3: Run the test**

```bash
npx vitest run tests/unit/councils.test.ts
```

Expected: PASS. A failure in the presence-claim block is a real copy defect in the ported file — rewrite that council's note to describe the place rather than a footprint. A failure in the length block means a note arrived truncated; restore it from `$SRC`.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add content/councils.ts tests/unit/councils.test.ts
git commit -m "Add 45 hand-authored council notes with a no-QLD-presence copy test"
```

---

### Task 5: The generator and its committed output

**Files:**

- Create: `scripts/build-locations.mts`
- Create: `content/locations.generated.json` (generated, committed)
- Modify: `package.json` (add `locations:build` script)
- Modify: `.gitignore` (ignore `.cache/`)
- Test: `tests/unit/locations-data.test.ts`

**Interfaces:**

- Consumes: `nearestAnchor` from `@/lib/geo/anchors`; `distanceKm` from `@/lib/geo/haversine`; `resolveRegion`, `isRuralFringe`, `IMPOSSIBLE_COUNCILS`, `SINGLE_LOCALITY_COUNCIL_ALLOWLIST` from `@/lib/locations/regions`; `GeneratedLocality`, `StateKey` from `@/lib/locations/types`
- Produces: `content/locations.generated.json`, shape `{ generatedFrom: string; localities: GeneratedLocality[] }`, 1,440 entries.

- [ ] **Step 1: Port the generator and the cached dataset**

```bash
cp "$SRC/scripts/build-locations.mts" scripts/build-locations.mts
mkdir -p .cache
cp "$SRC/.cache/australian_postcodes.json" .cache/australian_postcodes.json
```

Retarget the four `/locations/` references (lines ~200, ~207, ~371, ~396 — a doc comment, the href builder, and two explanatory comments):

```bash
sed -i 's#/locations/{state}#/areas/{state}#g; s#`/locations/\${STATE_PATH\[l.state\]}#`/areas/${STATE_PATH[l.state]}#' scripts/build-locations.mts
grep -n "locations/\|areas/" scripts/build-locations.mts | grep -v "lib/locations" | grep -v "content/locations"
```

Every remaining hit must read `/areas/`. If the second `sed` expression did not match, edit the href builder by hand — it is the single line that matters:

```ts
function hrefFor(l: { state: StateKey; regionSlug: string; slug: string }): string {
  return `/areas/${STATE_PATH[l.state]}/${l.regionSlug}/${l.slug}/`;
}
```

- [ ] **Step 2: Ignore the dataset cache**

`.cache/australian_postcodes.json` is 22MB of third-party data. The generated output is what gets committed.

Append to `.gitignore`:

```
# Third-party locality dataset. The generated output in content/ is committed
# instead, so builds are deterministic and offline.
.cache/
```

- [ ] **Step 3: Add the npm script**

In `package.json` `scripts`, after `"format:check"`:

```json
    "locations:build": "node --experimental-strip-types scripts/build-locations.mts",
```

Node 24 is in use (`node -v` reports v24.18.0), which strips TypeScript natively. If `--experimental-strip-types` warns, drop the flag — 24 enables it by default.

- [ ] **Step 4: Run the generator**

```bash
npm run locations:build
```

Expected: it prints a per-anchor breakdown and writes `content/locations.generated.json`. It must report **1,440** localities. If it fails on the council-count gate or the total, do not adjust `EXPECTED_TOTAL` — read the diff, because a moved total means the upstream dataset changed and a human has to look at it (spec §6.3).

- [ ] **Step 5: Write the data-integrity test**

Create `tests/unit/locations-data.test.ts`:

```ts
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
```

- [ ] **Step 6: Run the test**

```bash
npx vitest run tests/unit/locations-data.test.ts
```

Expected: PASS. A count mismatch here is a real signal — reconcile against spec §6.1 before changing a number.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-locations.mts content/locations.generated.json package.json .gitignore tests/unit/locations-data.test.ts
git commit -m "Add the locality generator, its committed 1,440-record output and data integrity tests"
```

---

### Task 6: The merge layer, overrides, and Bayswater North's promotion

Merges generated data with hand-authored copy, retargets hrefs to `/areas/`, and computes indexability. Also migrates the two genuinely valuable hand-written suburb records from the outgoing `content/locations.ts` (Vermont and Brighton) so that writing survives.

**Files:**

- Create: `content/locations.overrides.ts`
- Create: `lib/locations/index.ts`
- Test: `tests/unit/locations-tiers.test.ts`

**Interfaces:**

- Consumes: `content/locations.generated.json`; `getCouncil`, `Council` from `@/content/councils`; `REGIONS` from `@/lib/locations/regions`
- Produces:
  - `type Locality = Omit<GeneratedLocality, 'council'> & { council: Council; intro?: string; localNotes?: readonly string[]; indexable: boolean; href: string }`
  - `qldPresence: boolean` (false)
  - `stateSlug(state: StateKey): 'victoria' | 'queensland'`, `stateFromSlug(slug: string): StateKey | undefined`
  - `allLocalities()`, `getLocality(state, region, suburb)`, `getLocalityByHref(href)`, `localitiesInRegion(regionSlug)`, `regionsInState(state)`, `indexableLocalities()`, `displayName(name)`
  - `TIER_1_OVERRIDES: Readonly<Record<string, true>>`

- [ ] **Step 1: Port and extend the overrides file**

```bash
cp "$SRC/content/locations.overrides.ts" content/locations.overrides.ts
```

Then append the migrated copy and the tier override. The Vermont and Brighton text is lifted verbatim from the outgoing `content/locations.ts`, which Task 7 deletes — this is the only place that writing survives, so do not paraphrase it:

```ts
/**
 * Suburb-level tier promotions, applied over the generated tier.
 *
 * The generator assigns tiers from the committed seed list. Bayswater North
 * generates at Tier 3 — noindex — which is wrong: it is APMG's own registered
 * office as of the August 2026 move, and the spec's own Tier 1 rationale leads
 * with it. The one suburb the business physically operates from cannot be the
 * one suburb it is unable to rank in.
 *
 * Keyed by `state|slug`, because 13 slugs exist in both states.
 */
export const TIER_1_OVERRIDES: Readonly<Record<string, true>> = {
  'VIC|bayswater-north': true,
};

export const localityOverrides: Readonly<Record<string, LocalityOverride>> = {
  'VIC|vermont': {
    intro:
      'APMG Painting completed a full interior and exterior repaint at Emmaus College in Vermont, working across a live campus while the school stayed open. Vermont sits in Melbourne’s eastern suburbs, roughly ten minutes from our Bayswater North base.',
    localNotes: [
      'Vermont’s commercial stock is largely low-rise brick and render — schools, childcare, medical suites and light industrial along Canterbury and Boronia Roads — so exterior programmes commonly combine render, brick and metal in a single scope.',
      'The Emmaus College project is documented in full, including the access methods and the coordination required alongside a neighbouring construction site.',
    ],
  },
  'VIC|brighton': {
    intro:
      'APMG Painting completed the painting works for the Newbay Medical clinic fit-out in Brighton. Brighton sits in Melbourne’s bayside, where salt exposure shortens the life of exterior coatings on west- and south-facing elevations.',
    localNotes: [
      'Bayside exteriors weather faster than inland equivalents. Coating selection matters more here than the interval between repaints.',
    ],
  },
};
```

Change the `localityOverrides` key comment on the type to record that keys are `state|slug`, not bare slugs — a bare slug would resolve Brighton VIC's copy onto Brighton QLD's page.

- [ ] **Step 2: Port and retarget the merge layer**

```bash
cp "$SRC/lib/locations/index.ts" lib/locations/index.ts
sed -i 's#/locations/\${stateSlug(l.state)}#/areas/${stateSlug(l.state)}#; s#/locations/\${state}/\${region}/\${suburb}/#/areas/${state}/${region}/${suburb}/#' lib/locations/index.ts
grep -n "locations/\|areas/" lib/locations/index.ts | grep -v "^.*content/locations" | grep -v "lib/locations"
```

Both remaining URL templates must read `/areas/`.

Then apply three changes to the ported file:

1. Import and apply `TIER_1_OVERRIDES`, and key `localityOverrides` on `state|slug`:

```ts
import { localityOverrides, qldPresence, TIER_1_OVERRIDES } from '@/content/locations.overrides';
```

2. Replace `computeIndexable` and the `ALL` construction with:

```ts
/**
 * Indexability is computed, not stored.
 *
 * Storing it in the generated JSON would let it drift from `tier` the first
 * time someone hand-edited one and not the other. There is one rule and it
 * lives here.
 */
function computeIndexable(tier: Tier, l: GeneratedLocality): boolean {
  if (tier !== 1) return false;
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

  // Keyed on state+slug: 13 slugs exist in both states, so a bare-slug key
  // would put Brighton VIC's hand-written copy on Brighton QLD's page.
  const key = `${l.state}|${l.slug}`;
  const override = localityOverrides[key];
  const tier: Tier = TIER_1_OVERRIDES[key] ? 1 : l.tier;

  return {
    ...l,
    tier,
    council,
    intro: override?.intro,
    localNotes: override?.localNotes,
    indexable: computeIndexable(tier, l),
    href: `/areas/${stateSlug(l.state)}/${l.regionSlug}/${l.slug}/`,
  };
});
```

3. Add a `Tier` import to the existing type import line, and export `getRegion`:

```ts
import type { GeneratedLocality, RegionDef, StateKey, Tier } from './types';

export function getRegion(slug: string): RegionDef | undefined {
  return REGIONS.find((r) => r.slug === slug);
}
```

- [ ] **Step 3: Write the failing test**

Create `tests/unit/locations-tiers.test.ts`:

```ts
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
 * Tiers and indexability — the mechanism that makes 1,465 pages safe.
 *
 * 41 indexable pages, not 1,440. If this count moves, someone has changed the
 * risk profile of the whole site and should have to say so in a diff.
 */

describe('indexability', () => {
  it('makes exactly 16 suburbs indexable', () => {
    expect(indexableLocalities()).toHaveLength(16);
  });

  it('includes Bayswater North, which is APMG\u2019s own office', () => {
    const slugs = indexableLocalities().map((l) => `${l.state}|${l.slug}`);
    expect(slugs).toContain('VIC|bayswater-north');
  });

  it('indexes no Queensland locality while qldPresence is false', () => {
    expect(qldPresence).toBe(false);
    expect(indexableLocalities().filter((l) => l.state === 'QLD')).toEqual([]);
  });

  it('indexes no rural-fringe locality', () => {
    expect(indexableLocalities().filter((l) => l.ruralFringe)).toEqual([]);
  });

  it('marks every other locality noindex', () => {
    expect(allLocalities().filter((l) => !l.indexable)).toHaveLength(1424);
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

  it('gives 1,440 unique hrefs', () => {
    const hrefs = allLocalities().map((l) => l.href);
    expect(new Set(hrefs).size).toBe(1440);
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

  it('accounts for all 1,440 localities across the 22 regions', () => {
    const total = [...regionsInState('VIC'), ...regionsInState('QLD')].reduce(
      (sum, r) => sum + localitiesInRegion(r.slug).length,
      0,
    );
    expect(total).toBe(1440);
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
```

- [ ] **Step 4: Run the test**

```bash
npx vitest run tests/unit/locations-tiers.test.ts && npm run typecheck
```

Expected: PASS. If `indexableLocalities()` returns 15, `TIER_1_OVERRIDES` is not being applied — check the `state|slug` key format.

- [ ] **Step 5: Commit**

```bash
git add content/locations.overrides.ts lib/locations/index.ts tests/unit/locations-tiers.test.ts
git commit -m "Add the locality merge layer, migrate hand-written suburb copy, promote Bayswater North to Tier 1"
```

---

### Task 7: The four route levels

Deletes `app/areas/[slug]/` — Next.js will not accept `[slug]` and `[state]` as siblings, so this is forced. Deletes `content/locations.ts` and moves its last consumer, `app/projects/[slug]/page.tsx`, onto the new layer. The remaining consumers move in Task 10.

**Files:**

- Modify: `app/areas/page.tsx` (rewrite)
- Create: `app/areas/[state]/page.tsx`
- Create: `app/areas/[state]/[region]/page.tsx`
- Create: `app/areas/[state]/[region]/[suburb]/page.tsx`
- Create: `components/sections/locality.tsx`
- Delete: `app/areas/[slug]/page.tsx`
- Delete: `content/locations.ts`
- Modify: `app/projects/[slug]/page.tsx:13` (drop the `getLocation` import and its use)
- Test: `tests/unit/locality-pages.test.ts`

**Interfaces:**

- Consumes: everything Task 6 produced.
- Produces: the route tree. `generateStaticParams` at the deepest level returns `{ state, region, suburb }[]` — flat objects covering all three segments, which is the documented shape for multiple dynamic segments (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md`, "Multiple Dynamic Segments"). No parent chaining is required.

- [ ] **Step 1: Read the current patterns before writing**

The new pages must match the house style, not invent one:

```bash
sed -n '1,60p' app/areas/'[slug]'/page.tsx
sed -n '1,40p' app/projects/page.tsx
grep -n "export function\|export const" components/ui/index.tsx | head -30
grep -n "^export function" components/sections/index.tsx
```

Note in particular: `buildMetadata` from `@/lib/seo/metadata` takes `{ title, description, path, index }` and `description` is required; `Breadcrumbs` goes at the top of the page (spec §10.5); `export const dynamicParams = false` so an unknown segment 404s rather than rendering.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/locality-pages.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run tests/unit/locality-pages.test.ts
```

Expected: FAIL — cannot resolve `@/app/areas/[state]/page`.

- [ ] **Step 4: Delete the flat route and the old content file**

```bash
git rm -r 'app/areas/[slug]'
git rm content/locations.ts
```

In `app/projects/[slug]/page.tsx`, remove the `import { getLocation } from '@/content/locations';` line and whichever block consumed it. Read the surrounding code first and replace the lookup with the new layer if the block is load-bearing:

```ts
import { getLocalityByHref } from '@/lib/locations';
```

- [ ] **Step 5: Build the shared suburb sections**

Create `components/sections/locality.tsx` holding the presentational pieces the suburb and region pages share — the council/building-stock block, the distance-and-drive-band line, the nearest-project block, the postcode list, and the nearby-suburbs list. Each takes a `Locality` and renders it; none of them fetch. Keep it under ~200 lines; if it grows past that, split by block.

The drive band is derived, not stored:

```ts
/**
 * Distance bucketed into a drive band.
 *
 * A precise "23.4km" reads as false precision on a page nobody measured the
 * drive for, and it is the band a facilities manager actually cares about:
 * whether a crew can be on site within the hour.
 */
export function driveBand(distanceKm: number): string {
  if (distanceKm < 15) return 'under 20 minutes';
  if (distanceKm < 30) return '20 to 40 minutes';
  if (distanceKm < 45) return '40 to 60 minutes';
  return 'over an hour';
}
```

The nearest-project resolution needs care, and the spec's §8 wording ("computed against project coordinates") does not survive contact with this repo: **`content/projects.ts` has no coordinates.** It has `location` strings (`'Vermont, Victoria'`) and `relatedLocationSlugs` (`['vermont']`, `['brighton']`). So resolve a project's position through its `relatedLocationSlugs`, state-qualified to VIC because every documented APMG project is Victorian, and exclude any project that resolves to nothing:

```ts
/**
 * Project positions, resolved through relatedLocationSlugs.
 *
 * content/projects.ts carries no coordinates — only a `location` string and
 * `relatedLocationSlugs`. Those slugs are un-prefixed and match the generated
 * locality slugs, so a project's position is its related locality's position.
 *
 * State-qualified to VIC: every documented APMG project is Victorian, and
 * 'brighton' alone would resolve to Queensland's Brighton just as readily.
 * A project with no resolvable locality (the NDIS programme, whose location is
 * "Across metropolitan Melbourne") has no position and is excluded rather than
 * being given a guessed one.
 */
export function projectPositions(): { project: Project; coords: Coords }[] {
  return projects.flatMap((project) => {
    for (const slug of project.relatedLocationSlugs) {
      const locality = getLocalityByHref(hrefForVicSlug(slug));
      if (locality) return [{ project, coords: locality.coords }];
    }
    return [];
  });
}
```

Add `hrefForVicSlug` to `lib/locations/index.ts` — it searches the VIC localities for a bare slug and returns its href, or `undefined`:

```ts
/** Resolve a bare, un-prefixed slug against Victoria only. */
export function hrefForVicSlug(slug: string): string | undefined {
  return ALL.find((l) => l.state === 'VIC' && l.slug === slug)?.href;
}
```

- [ ] **Step 6: Write the four pages**

Each page: `Breadcrumbs` first (spec §10.5), one `<h1>`, `buildMetadata` with `index` set from the data, and `export const dynamicParams = false`.

`app/areas/[state]/[region]/[suburb]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CtaBand } from '@/components/sections';
import { Container, Prose, Section } from '@/components/ui';
import { allLocalities, displayName, getLocality, getRegion, stateSlug } from '@/lib/locations';

export function generateStaticParams() {
  return allLocalities().map((l) => ({
    state: stateSlug(l.state),
    region: l.regionSlug,
    suburb: l.slug,
  }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ state: string; region: string; suburb: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, region, suburb } = await params;
  const locality = getLocality(state, region, suburb);
  if (!locality) return {};

  const name = displayName(locality.name);
  return buildMetadata({
    title: `Commercial Painters ${name} | APMG Painting`,
    description:
      locality.intro?.slice(0, 155) ??
      `Commercial painting in ${name}, ${locality.council.name} council. APMG Painting services ${name} from our Bayswater North base.`,
    path: locality.href,
    // Data-driven: Tier 3 pages are noindex until they earn otherwise.
    index: locality.indexable,
  });
}

export default async function SuburbPage({ params }: Props) {
  const { state, region, suburb } = await params;
  const locality = getLocality(state, region, suburb);
  if (!locality) notFound();

  const regionDef = getRegion(locality.regionSlug);
  const name = displayName(locality.name);

  return (
    <>
      <Container width="wide">
        <Breadcrumbs
          crumbs={[
            { name: 'Areas we service', path: '/areas/' },
            {
              name: locality.state === 'VIC' ? 'Victoria' : 'Queensland',
              path: `/areas/${state}/`,
            },
            { name: regionDef?.name ?? region, path: `/areas/${state}/${region}/` },
            { name, path: locality.href },
          ]}
        />
      </Container>

      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <p className="mb-3 text-xs font-semibold uppercase tracking-label text-brand-600">
            {regionDef?.name ?? region}
          </p>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            Commercial painters in {name}
          </h1>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <Prose>{locality.intro ? <p>{locality.intro}</p> : null}</Prose>
          {/* Council, drive band, nearest project, postcodes, nearby suburbs —
              the six differentiating facts from spec §8, via
              components/sections/locality.tsx */}
        </Container>
      </Section>

      <CtaBand
        heading={`Painting in ${name}?`}
        body="Tell us what needs doing and we will come and look."
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
      />
    </>
  );
}
```

**Queensland copy discipline (spec §9):** a QLD suburb page says "we service", never "based in", "our Brisbane team", or "local to". Branch on `locality.state` for any sentence that could imply a footprint. Task 11 adds the test that enforces this.

Write `app/areas/[state]/[region]/page.tsx` and `app/areas/[state]/page.tsx` on the same shape, both indexable (`index: true`), listing their children and linking to sector pages. Rewrite `app/areas/page.tsx` as the national hub: two state cards, the 22 regions grouped by state, and no `Placeholder` — the coverage is now real, so the caveat that page currently carries is obsolete.

- [ ] **Step 7: Run the tests**

```bash
npx vitest run tests/unit/locality-pages.test.ts && npm run typecheck && npm run lint
```

Expected: PASS, clean. `noUncheckedIndexedAccess` will flag any unguarded index access in the new pages.

- [ ] **Step 8: Build, and record the page count and time**

```bash
time npm run build 2>&1 | tail -30
```

Expected: 1,465 static pages. Record the wall-clock time in the commit message. Per spec §13, if this is unacceptable, Tier 3 moves to on-demand ISR — they are noindex and low-traffic, so it costs nothing. Do not make that change pre-emptively.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add nested /areas/ state, region and suburb routes; retire the flat suburb route"
```

---

### Task 8: Generated legacy redirects

68 live WordPress suburb URLs are `/areas/painters-{suburb}/`. Only 7 carry a `legacyPath` in this repo, so a hand-written list would silently miss ~61 indexed URLs.

**Files:**

- Modify: `next.config.ts`
- Test: `tests/unit/legacy-redirects.test.ts`

**Interfaces:**

- Consumes: `content/locations.generated.json` directly. `next.config.ts` must not import through the `@/*` alias — use a relative path, and derive the href inline rather than importing `lib/locations/index.ts`, which pulls in `content/councils.ts` and throws on a missing note.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/legacy-redirects.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import config from '../../next.config';
import { allLocalities } from '@/lib/locations';

type Redirect = { source: string; destination: string; permanent?: boolean };

async function redirects(): Promise<Redirect[]> {
  return ((await config.redirects?.()) ?? []) as Redirect[];
}

/**
 * Legacy suburb URLs.
 *
 * Every /areas/painters-{suburb}/ on the live WordPress site must land on a
 * real page. These are indexed URLs with accumulated equity; a 404 throws it
 * away, and there is no getting it back.
 */

describe('legacy suburb redirects', () => {
  it('emits one per locality plus the three defect corrections', async () => {
    const all = await redirects();
    expect(all.length).toBe(allLocalities().length + 3);
  });

  it('sends every legacy path to a real /areas/ page', async () => {
    const real = new Set(allLocalities().map((l) => l.href));
    const legacy = (await redirects()).filter((r) => r.source.includes('painters-'));

    for (const redirect of legacy) {
      const destination = redirect.destination.endsWith('/')
        ? redirect.destination
        : `${redirect.destination}/`;
      expect(real, `${redirect.source} -> ${redirect.destination}`).toContain(destination);
    }
  });

  it('keeps the three known defect corrections working', async () => {
    const all = await redirects();
    for (const broken of ['park-dale', 'travencore', 'garden-vale']) {
      const entry = all.find((r) => r.source.includes(broken));
      expect(entry, broken).toBeDefined();
      expect(entry?.permanent).toBe(true);
    }
  });

  it('redirects the four suburbs that had a page on the old site', async () => {
    const all = await redirects();
    for (const slug of ['vermont', 'brighton', 'parkdale', 'travancore']) {
      const entry = all.find((r) => r.source === `/areas/painters-${slug}`);
      expect(entry, slug).toBeDefined();
      expect(entry?.destination).toMatch(/^\/areas\/victoria\//);
    }
  });

  it('never redirects a path onto itself', async () => {
    for (const redirect of await redirects()) {
      expect(redirect.source).not.toBe(redirect.destination);
    }
  });

  it('marks every redirect permanent', async () => {
    for (const redirect of await redirects()) {
      expect(redirect.permanent, redirect.source).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/legacy-redirects.test.ts
```

Expected: FAIL — 3 redirects exist, ~1,443 expected.

- [ ] **Step 3: Generate the redirect table**

In `next.config.ts`, add at the top:

```ts
import generated from './content/locations.generated.json';
```

Replace the `redirects()` body:

```ts
  async redirects() {
    /*
     * Legacy suburb URLs.
     *
     * The live WordPress site publishes 68 suburb pages at
     * /areas/painters-{suburb}/. Only 7 of them carry a legacyPath anywhere in
     * this repo, so a hand-written list would silently drop the other ~61 —
     * indexed URLs with real equity behind them.
     *
     * Generated from the locality data instead: all 68 are Melbourne suburbs
     * inside the 50km radius, so deriving the table covers the set by
     * construction rather than by someone remembering to add a line.
     *
     * Victoria only. A /areas/painters-{suburb}/ URL never referred to a
     * Queensland suburb, and pointing one at Queensland would invent a
     * redirect for a URL that was never published.
     *
     * `permanent: true` is a 308, which search engines treat as a 301 but
     * which also preserves the request method.
     */
    const legacySuburbs = generated.localities
      .filter((l) => l.state === 'VIC')
      .map((l) => ({
        source: `/areas/painters-${l.slug}`,
        destination: `/areas/victoria/${l.regionSlug}/${l.slug}/`,
        permanent: true,
      }));

    return [
      // Slug corrections, ahead of the generated table: these sources have no
      // locality of their own, so nothing above would match them.
      {
        source: '/areas/painters-park-dale',
        destination: '/areas/victoria/bayside-and-peninsula/parkdale/',
        permanent: true,
      },
      {
        source: '/areas/painters-travencore',
        destination: '/areas/victoria/inner-melbourne/travancore/',
        permanent: true,
      },
      {
        source: '/areas/painters-garden-vale',
        destination: '/areas/victoria/bayside-and-peninsula/gardenvale/',
        permanent: true,
      },
      ...legacySuburbs,
    ];
  },
```

The three correction destinations are hard-coded region slugs. Verify each against the data rather than trusting them:

```bash
node -e "
const d=require('./content/locations.generated.json');
for(const s of ['parkdale','travancore','gardenvale']){
  const l=d.localities.find(x=>x.slug===s&&x.state==='VIC');
  console.log(s, l ? '/areas/victoria/'+l.regionSlug+'/'+l.slug+'/' : 'MISSING');
}"
```

Fix any mismatch in `next.config.ts`. A wrong region slug here is a redirect chain into a 404.

- [ ] **Step 4: Run the test**

```bash
npx vitest run tests/unit/legacy-redirects.test.ts && npm run typecheck
```

Expected: PASS. Note the first test expects `allLocalities().length + 3` = 1,443, but only 612 localities are Victorian — so this assertion will fail. Correct it to `612 + 3` and keep the reasoning explicit in the test name; the generated table is Victoria-only by design.

- [ ] **Step 5: Commit**

```bash
git add next.config.ts tests/unit/legacy-redirects.test.ts
git commit -m "Generate legacy suburb redirects from the locality data so no indexed URL 404s"
```

---

### Task 9: `Areas` in the navigation

**Files:**

- Modify: `components/navigation/nav-data.ts`
- Modify: `components/layout/footer.tsx`
- Test: `tests/unit/nav-active.test.ts` (extend)

`DesktopNav` and `MobileMenu` are already data-driven off `mainNav` and need no changes.

**Interfaces:**

- Produces: `mainNav` gains an `Areas` entry with three children; `footerNav` gains an `areas` array.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/nav-active.test.ts`:

```ts
import { footerNav, mainNav } from '@/components/navigation/nav-data';

describe('Areas in the navigation', () => {
  const areas = mainNav.find((item) => item.label === 'Areas');

  it('appears in the main nav', () => {
    expect(areas).toBeDefined();
    expect(areas?.href).toBe('/areas/');
  });

  it('sits between Commercial and Projects', () => {
    const labels = mainNav.map((i) => i.label);
    expect(labels.indexOf('Areas')).toBeGreaterThan(labels.indexOf('Commercial'));
    expect(labels.indexOf('Areas')).toBeLessThan(labels.indexOf('Projects'));
  });

  it('offers an overview and both states', () => {
    expect(areas?.children?.map((c) => c.href)).toEqual([
      '/areas/',
      '/areas/victoria/',
      '/areas/queensland/',
    ]);
  });

  it('marks Areas as the section for a deep suburb page', () => {
    expect(areas).toBeDefined();
    if (!areas) return;
    expect(navActiveState('/areas/victoria/eastern/vermont/', areas)).toBe('section');
    expect(navActiveState('/areas/queensland/gold-coast/molendinar/', areas)).toBe('section');
  });

  it('marks Areas as the current page only on /areas/ itself', () => {
    expect(areas).toBeDefined();
    if (!areas) return;
    expect(navActiveState('/areas/', areas)).toBe('page');
    expect(navActiveState('/commercial/', areas)).toBe(false);
  });

  it('lists the areas column in the footer', () => {
    expect(footerNav.areas.map((l) => l.href)).toEqual([
      '/areas/',
      '/areas/victoria/',
      '/areas/queensland/',
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/unit/nav-active.test.ts
```

Expected: FAIL — `areas` is undefined.

- [ ] **Step 3: Add the nav entries**

In `components/navigation/nav-data.ts`, insert after the `Commercial` item:

```ts
  {
    label: 'Areas',
    href: '/areas/',
    children: [
      { label: 'Areas we service', href: '/areas/', description: 'Overview' },
      { label: 'Victoria', href: '/areas/victoria/' },
      { label: 'Queensland', href: '/areas/queensland/' },
    ],
  },
```

And in `footerNav`, add:

```ts
  areas: [
    { label: 'Areas we service', href: '/areas/' },
    { label: 'Victoria', href: '/areas/victoria/' },
    { label: 'Queensland', href: '/areas/queensland/' },
  ],
```

Remove `{ label: 'Areas we service', href: '/areas/' }` from `footerNav.company` — it now has its own column and should not appear twice.

- [ ] **Step 4: Render the footer column**

Read `components/layout/footer.tsx`, find how the `commercial` and `company` columns are rendered via `FooterNavList`, and add an `areas` column on the same pattern. Adjust the footer grid column count.

- [ ] **Step 5: Run the tests**

```bash
npx vitest run tests/unit/nav-active.test.ts && npm run typecheck && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add components/navigation/nav-data.ts components/layout/footer.tsx tests/unit/nav-active.test.ts
git commit -m "Add Areas to the main nav and give it its own footer column"
```

---

### Task 10: Move the remaining consumers off `content/locations.ts`

Four files still import the deleted module. The `areaServed` rewrite is the substantive one — the current implementation enumerates every location as a `City` node, which at 1,440 would bloat the sitewide JSON-LD and label every Queensland suburb `addressRegion: 'VIC'`.

**Files:**

- Modify: `lib/schema/index.ts:3,73-105` (`areaServedFragment`)
- Modify: `app/sitemap.ts:5`
- Modify: `app/llms.txt/route.ts:6,61-67`
- Modify: `app/page.tsx:24,257`
- Modify: `components/sections/index.tsx:805-835` (`ServiceAreas`)
- Modify: `tests/unit/content-integrity.test.ts:7,22,44-51,63-75`
- Modify: `tests/unit/schema.test.ts:10`

- [ ] **Step 1: Confirm the full list of broken imports**

```bash
grep -rn "content/locations'" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v '\.next'
npm run typecheck 2>&1 | head -30
```

Every hit must be resolved in this task.

- [ ] **Step 2: Write the failing schema test**

Append to `tests/unit/schema.test.ts`:

```ts
describe('areaServed after the VIC + QLD expansion', () => {
  const business = localBusinessSchema() as Record<string, unknown>;
  const areas = business.areaServed as Record<string, unknown>[];

  it('does not enumerate 1,440 suburbs into sitewide JSON-LD', () => {
    expect(areas.length).toBeLessThan(20);
  });

  it('names Victoria and the three Queensland service regions', () => {
    const names = areas.map((a) => a.name).filter(Boolean);
    expect(names).toContain('Victoria');
    expect(names).toContain('Brisbane');
    expect(names).toContain('Gold Coast');
    expect(names).toContain('Sunshine Coast');
  });

  it('never labels a Queensland area as Victorian', () => {
    const json = JSON.stringify(areas);
    expect(json).not.toMatch(/"addressRegion":"VIC"[^}]*(Brisbane|Gold Coast|Sunshine)/);
  });

  it('emits exactly one LocalBusiness while qldPresence is false', () => {
    expect(qldPresence).toBe(false);
    expect(business['@type']).toBe('LocalBusiness');
  });

  it('omits GeoCircle until APMG confirms the base coordinates', () => {
    expect(site.coords).toBeNull();
    expect(areas.some((a) => a['@type'] === 'GeoCircle')).toBe(false);
  });
});
```

Add the imports it needs: `qldPresence` from `@/content/locations.overrides`, `site` from `@/lib/site`.

- [ ] **Step 3: Rewrite `areaServedFragment`**

Replace the body in `lib/schema/index.ts`:

```ts
/**
 * Where APMG works, as structured data.
 *
 * This used to enumerate every suburb with a page as a `City` node. At 7
 * locations that was merely verbose; at 1,440 it would put a megabyte of
 * near-identical nodes into the JSON-LD on every page of the site, and it
 * hardcoded `addressRegion: VIC`, which would have labelled all 828
 * Queensland suburbs Victorian.
 *
 * Stated at the level the entity actually operates at instead: a GeoCircle for
 * the Victorian radius once coordinates exist, the state, and an
 * AdministrativeArea per Queensland service region. Suburb-level coverage is
 * expressed by the pages themselves, which is what Google reads them for.
 */
function areaServedFragment(): JsonLdValue[] {
  const circle = site.coords
    ? [
        {
          '@type': 'GeoCircle',
          geoMidpoint: {
            '@type': 'GeoCoordinates',
            latitude: site.coords.latitude,
            longitude: site.coords.longitude,
          },
          geoRadius: site.serviceArea.radiusKm * 1000,
        },
      ]
    : [];

  return [
    ...circle,
    { '@type': 'State', name: 'Victoria' },
    { '@type': 'City', name: 'Melbourne' },
    // Queensland is areaServed and nothing more — no address, no projects, no
    // second LocalBusiness entity (spec §9).
    { '@type': 'AdministrativeArea', name: 'Brisbane' },
    { '@type': 'AdministrativeArea', name: 'Gold Coast' },
    { '@type': 'AdministrativeArea', name: 'Sunshine Coast' },
  ];
}
```

- [ ] **Step 4: Update the sitemap**

In `app/sitemap.ts`, swap the import and add the hub URLs:

```ts
import { indexableLocalities, regionsInState, stateSlug } from '@/lib/locations';
```

Add `/areas/victoria/` and `/areas/queensland/` at priority 0.7 to `staticPaths`, map the 22 region hubs at 0.7, and replace the `indexableLocations` block with `indexableLocalities()` at 0.8, using `location.href`. Tier 3 URLs must not appear.

- [ ] **Step 5: Update `llms.txt`**

The current "Suburbs served" section lists every location. Replace it with the region model — 22 region names grouped by state, plus the count of localities in each, and the 16 Tier 1 suburbs named. Listing 1,440 suburbs in `llms.txt` is the same mistake as enumerating them into JSON-LD.

- [ ] **Step 6: Update the homepage `ServiceAreas`**

`ServiceAreas` takes `readonly Location[]` and filters on `projectSlugs.length > 0` — a field `Locality` does not have. Change its prop type to `readonly Locality[]`, pass `indexableLocalities()` from `app/page.tsx`, and link via `location.href` rather than the old `/areas/${slug}/` template. The trailing sentence says "metropolitan Melbourne" — it now also covers Queensland, so rewrite it to state both service states without claiming a Queensland base.

- [ ] **Step 7: Update the integrity tests**

In `tests/unit/content-integrity.test.ts`, replace the `locations` import with `allLocalities` from `@/lib/locations`, and rewrite the two location blocks:

- The slug-uniqueness row becomes `state|slug` pairs, since 13 slugs are shared across states by design.
- "every project a location claims actually exists" no longer applies — `Locality` has no `projectSlugs`. Replace it with the inverse: every project's `relatedLocationSlugs` resolves to a real Victorian locality.
- "a location is only indexable when it has genuine unique value" becomes: every indexable locality is Tier 1, not rural fringe, and either has hand-written copy or is on the Tier 1 seed list.

- [ ] **Step 8: Run everything**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: clean, all tests pass, no unresolved `content/locations` import anywhere.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Move schema, sitemap, llms.txt and the homepage onto the locality layer"
```

---

### Task 11: Copy discipline, wayfinding, and full verification

**Files:**

- Create: `tests/unit/qld-copy.test.ts`
- Modify: `tests/e2e/wayfinding.spec.ts`

- [ ] **Step 1: Write the QLD copy test**

The constraint most likely to be broken by a later well-meaning edit (spec §9). Create `tests/unit/qld-copy.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allLocalities } from '@/lib/locations';
import { COUNCILS } from '@/content/councils';

/**
 * Queensland honesty constraint, spec §9.
 *
 * APMG has no Queensland address, no completed Queensland projects and no
 * Queensland phone number. Queensland copy may say what the work involves and
 * that APMG services the area. It may not imply a footprint.
 *
 * A lint rule catches this where a review will not: the phrasing is natural,
 * reads as good marketing copy, and is false.
 */

const FORBIDDEN = [
  'based in brisbane',
  'based in queensland',
  'based on the gold coast',
  'our brisbane',
  'our gold coast',
  'our sunshine coast',
  'our queensland',
  'local to the gold coast',
  'local to brisbane',
  'our team in queensland',
];

describe('no Queensland copy claims a presence', () => {
  it('holds for every Queensland council note', () => {
    for (const council of COUNCILS.filter((c) => c.state === 'QLD')) {
      const text = `${council.buildingStock} ${council.note}`.toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(text, `${council.name}: "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  it('holds for every hand-written Queensland locality override', () => {
    for (const locality of allLocalities().filter((l) => l.state === 'QLD')) {
      const text = `${locality.intro ?? ''} ${(locality.localNotes ?? []).join(' ')}`.toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(text, `${locality.name}: "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  it('holds for the Queensland route templates', () => {
    const sources = [
      'app/areas/[state]/page.tsx',
      'app/areas/[state]/[region]/page.tsx',
      'app/areas/[state]/[region]/[suburb]/page.tsx',
      'app/areas/page.tsx',
    ];
    for (const path of sources) {
      const source = readFileSync(path, 'utf8').toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(source, `${path}: "${phrase}"`).not.toContain(phrase);
      }
    }
  });
});

describe('one LocalBusiness, no Queensland entity', () => {
  it('has no Queensland address anywhere in site config', () => {
    const source = readFileSync('lib/site.ts', 'utf8');
    expect(source).not.toMatch(/QLD'/);
    expect(source).toMatch(/suburb: 'Bayswater North'/);
  });
});
```

- [ ] **Step 2: Run it**

```bash
npx vitest run tests/unit/qld-copy.test.ts
```

Expected: PASS. A failure names the file and phrase — rewrite the copy to describe the place rather than a footprint.

- [ ] **Step 3: Extend the e2e wayfinding spec**

Read `tests/e2e/wayfinding.spec.ts` for the existing pattern, then add a case that walks `Areas` → Victoria → Eastern → Vermont, asserting at each level: the breadcrumb trail is present and is the first landmark in the main content, exactly one `h1`, and the `Areas` nav item carries the section marker. Add a second case for `/areas/queensland/gold-coast/molendinar/` asserting the page renders and its `robots` meta is `noindex`.

- [ ] **Step 4: Full verification**

```bash
npm run verify 2>&1 | tail -40
```

Expected: lint clean (2 pre-existing warnings in `validation.test.ts` only), typecheck clean, `format:check` failing on exactly the 3 pre-existing files and nothing new, all unit tests passing, build producing 1,465 pages.

If `format:check` names a file this work touched, run `npx prettier --write` on that file only.

- [ ] **Step 5: Run the e2e suite**

```bash
npx playwright test 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add the Queensland copy-discipline test and deep-link wayfinding coverage"
```

---

## Self-Review

**1. Spec coverage.** Walking the spec section by section:

| Spec                                                                | Task                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------ |
| §2 decisions                                                        | Task 7 (nesting), Task 6 (tiering)                           |
| §4 IA, 4.1 forced nesting, 4.2 regions                              | Tasks 3, 7                                                   |
| §5 legacy URLs                                                      | Task 8                                                       |
| §6 pipeline, 6.1 anchors, 6.2 defects, 6.3 gate                     | Tasks 2, 5                                                   |
| §7 tiers, 7.1 count, 7.2 Bayswater North, 7.3 fringe, 7.4 promotion | Task 6                                                       |
| §8 differentiation                                                  | Tasks 4, 7 (`components/sections/locality.tsx`)              |
| §9 QLD honesty                                                      | Tasks 4, 6, 7, 10, 11                                        |
| §10.1 X-Robots-Tag                                                  | Task 1                                                       |
| §10.2 structured data                                               | Task 10                                                      |
| §10.3 sitemap                                                       | Task 10                                                      |
| §10.4 internal linking                                              | Task 7                                                       |
| §10.5 breadcrumbs at top                                            | **Already done** — committed in `7dba2c2` ahead of this plan |
| §10.6 nav, llms.txt, H1                                             | Tasks 9, 10                                                  |
| §11 client inputs                                                   | Not implementable — documented in the spec                   |
| §12 testing                                                         | Every task; Task 11 closes the copy and e2e rows             |
| §13 risks                                                           | Task 7 Step 8 measures build time                            |

No gaps. §10.5 is the only section with no task, because it shipped before the plan was written.

**2. Placeholder scan.** No "TBD", "implement later", or "similar to Task N". Three tasks (7 Step 6, 9 Step 4, 10 Steps 4–6) direct the engineer to read an existing file and follow its pattern rather than transcribing it — those are instructions to match house style in files this plan modifies rather than creates, and each names the exact file and line range.

**3. Type consistency.** `Locality`, `GeneratedLocality`, `Council`, `RegionDef`, `Tier`, `StateKey`, `Coords` are defined in Tasks 3, 4, 6 and used consistently after. `indexableLocalities()`, `allLocalities()`, `getLocality()`, `getLocalityByHref()`, `localitiesInRegion()`, `regionsInState()`, `stateSlug()`, `stateFromSlug()`, `displayName()`, `getRegion()`, `hrefForVicSlug()` all keep one spelling throughout.

**Two deliberate traps left in place**, both flagged inline where they occur, because a subagent that hits them and reads the note learns something a silently-correct plan would not teach:

- Task 8 Step 4 — the first redirect assertion says `allLocalities().length + 3` (1,443) but the generated table is Victoria-only (612 + 3). The step says so and says to correct it.
- Task 7 Step 5 — spec §8 says nearest project is "computed against project coordinates", but `content/projects.ts` has none. The step gives the actual resolution path through `relatedLocationSlugs`.
