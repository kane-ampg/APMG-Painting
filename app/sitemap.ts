import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { sectors } from '@/content/sectors';
import { projects, sectorHasDocumentedProject } from '@/content/projects';
import { indexableLocalities, REGIONS, stateSlug } from '@/lib/locations';

/**
 * Sitemap.
 *
 * The live WordPress site has no working sitemap at all — every sitemap
 * endpoint returns HTTP 500.
 *
 * Only indexable URLs appear here. Location pages flagged `indexable: false`
 * are excluded, because listing a noindex URL in a sitemap sends Google two
 * contradictory instructions.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths: { path: string; priority: number }[] = [
    { path: '/', priority: 1 },
    { path: '/commercial/', priority: 0.9 },
    { path: '/office-painters/', priority: 0.8 },
    { path: '/projects/', priority: 0.8 },
    { path: '/trade-services/', priority: 0.6 },
    { path: '/about-us/', priority: 0.5 },
    { path: '/contact-us/', priority: 0.7 },
    /*
     * /areas/ sits above the two state hubs and the 22 region hubs, so it
     * cannot be priced below them. It was 0.5 — under its own children at 0.7
     * — which told Google the least important page in the /areas/ tree was its
     * root. It is the entry point to the largest section of the site.
     */
    { path: '/areas/', priority: 0.8 },
    { path: '/areas/victoria/', priority: 0.7 },
    { path: '/areas/queensland/', priority: 0.7 },
  ];

  /*
   * No `lastmod` at all, deliberately.
   *
   * It was previously `new Date()` on every URL, which tells Google the
   * entire site changed on every deploy, including a deploy that only touched
   * a stylesheet — and a `lastmod` that is always "now" is a `lastmod` Google
   * learns to ignore, which costs the recrawl priority the field exists to
   * buy. No content model on this site carries a real modification date yet,
   * and an invented one is worse than none: omit the field until a genuine
   * date exists to put in it.
   */
  return [
    ...staticPaths.map((entry) => ({
      url: `${siteUrl}${entry.path}`,
      changeFrequency: 'monthly' as const,
      priority: entry.priority,
    })),
    /*
     * Sectors follow the same evidence rule as the suburb tiers: no
     * documented project, no index — the page itself renders `noindex` from
     * the same predicate (app/[sector]/page.tsx), and a noindex URL in a
     * sitemap sends Google two contradictory instructions.
     */
    ...sectors.filter(sectorHasDocumentedProject).map((sector) => ({
      url: `${siteUrl}${sector.legacyPath}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}/`,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
    /*
     * Region hubs — 22 of them, all indexable (spec §4/§9): each is the page
     * meant to rank for a region-level query ("commercial painters eastern
     * suburbs Melbourne").
     */
    ...REGIONS.map((region) => ({
      url: `${siteUrl}/areas/${stateSlug(region.state)}/${region.slug}/`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    /*
     * Suburb pages.
     *
     * These were the lowest-priority, least-frequently-changing URLs on the
     * site, below every project case study. That is backwards for a local
     * trade: "painters <suburb>" is the query APMG can realistically win, and
     * only pages carrying genuine unique value are indexable at all — so
     * every URL in this list has already passed the evidence test that the
     * rest of the sitemap does not apply. `indexableLocalities()` is the same
     * filter the pages themselves render `noindex` from — a Tier 3 URL cannot
     * appear here, because listing a noindex URL in a sitemap gives Google
     * two contradictory instructions. They are ranked accordingly.
     */
    ...indexableLocalities().map((location) => ({
      url: `${siteUrl}${location.href}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
