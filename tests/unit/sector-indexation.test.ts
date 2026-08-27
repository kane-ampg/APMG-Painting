import { describe, expect, it } from 'vitest';
import { sectors } from '@/content/sectors';
import { projects } from '@/content/projects';
import { generateMetadata } from '@/app/[sector]/page';
import sitemap from '@/app/sitemap';

/**
 * Sector indexation follows evidence, the same way suburb tiers do.
 *
 * Five of the eight sector pages document no completed project. Those pages
 * used to be index,follow and sitemap-listed while their own body copy said
 * they were placeholders — the thinnest possible signal to send about a page.
 * The rule is now computed in one place from the same predicate on both
 * surfaces: a sector without a documented project is `noindex, follow` and
 * stays out of the sitemap, exactly like a Tier 3 suburb. Documenting a
 * project flips both automatically.
 */

function paramsFor(legacyPath: string) {
  return { params: Promise.resolve({ sector: legacyPath.replace(/\//g, '') }) };
}

// Derived here independently of the production helper, so the test cannot be
// satisfied by the helper agreeing with itself. Evidence lives in two lists
// that can drift — the sector's curated projectSlugs and each project's own
// sectorSlug — and either one counts.
function hasEvidence(sector: (typeof sectors)[number]): boolean {
  return sector.projectSlugs.length > 0 || projects.some((p) => p.sectorSlug === sector.slug);
}

type Robots = { index?: boolean; follow?: boolean };

describe('sector indexation', () => {
  it('indexes a sector only when it documents a completed project', async () => {
    for (const sector of sectors) {
      const meta = await generateMetadata(paramsFor(sector.legacyPath));
      expect((meta.robots as Robots).index, sector.slug).toBe(hasEvidence(sector));
    }
  });

  it('keeps noindex sectors out of the sitemap', () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const sector of sectors) {
      const listed = urls.some((url) => url.endsWith(sector.legacyPath));
      expect(listed, sector.slug).toBe(hasEvidence(sector));
    }
  });

  it('keeps noindex sectors crawlable, so their links still carry equity', async () => {
    for (const sector of sectors.filter((s) => !hasEvidence(s))) {
      const meta = await generateMetadata(paramsFor(sector.legacyPath));
      expect((meta.robots as Robots).follow, sector.slug).toBe(true);
    }
  });
});
