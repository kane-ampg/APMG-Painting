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

/**
 * Phrases that assert a Queensland footprint.
 *
 * Exported, and imported by tests/unit/councils.test.ts rather than duplicated
 * there — one list, one place to strengthen.
 *
 * The list was stress-tested by running ten fabricated evasive claims through
 * an earlier, shorter version: only one was caught. Everything below the first
 * block exists because of a specific phrasing that slipped through. The
 * failure mode is not a marketer writing "we are based in Brisbane" — it is a
 * well-meaning edit adding "our crews here know the estates", which reads as
 * ordinary trade copy and is false.
 */
export const FORBIDDEN = [
  // Explicit location claims.
  'based in brisbane',
  'based in queensland',
  'based on the gold coast',
  'based on the sunshine coast',
  'our brisbane',
  'our gold coast',
  'our sunshine coast',
  'our queensland',
  'local to the gold coast',
  'local to brisbane',
  'our team in queensland',
  // Implied presence — the phrasings that got through the first version.
  'our crews here',
  'our crew here',
  'our team here',
  'our painters here',
  'servicing from',
  'our depot',
  'our branch',
  'our office in',
  'our local',
  'we have completed',
  "we've completed",
  'projects we have completed in',
  'years working in queensland',
];

/**
 * Route templates and shared components that render QLD-facing prose.
 *
 * The brief's original list named only the four `app/areas/**` route files.
 * `components/sections/locality.tsx` is added here because it, not the route
 * files, holds the prose that actually renders on every suburb page — the
 * facts card, the council block, the nearest-project block and the nearby
 * list. A phrase planted there would slip past a scan that only covered the
 * route files.
 */
const SOURCE_FILES = [
  'app/areas/page.tsx',
  'app/areas/[state]/page.tsx',
  'app/areas/[state]/[region]/page.tsx',
  'app/areas/[state]/[region]/[suburb]/page.tsx',
  'components/sections/locality.tsx',
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

  it('holds for the Queensland route templates and shared locality components', () => {
    for (const path of SOURCE_FILES) {
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
