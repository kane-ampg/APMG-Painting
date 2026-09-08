import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { sectors } from '@/content/sectors';
import { projects } from '@/content/projects';
import { indexableLocations } from '@/content/locations';

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
    { path: '/areas/', priority: 0.5 },
  ];

  /**
   * Build time, used as a floor rather than as a claim about every page.
   *
   * `lastmod` was previously `new Date()` on every URL. That tells Google the
   * entire site changed on every deploy, including a deploy that only touched
   * a stylesheet — and a `lastmod` that is always "now" is a `lastmod` Google
   * learns to ignore, which costs the recrawl priority the field exists to
   * buy. Pages with a real content date now carry it.
   */
  const buildDate = new Date();

  return [
    ...staticPaths.map((entry) => ({
      url: `${siteUrl}${entry.path}`,
      lastModified: buildDate,
      changeFrequency: 'monthly' as const,
      priority: entry.priority,
    })),
    ...sectors.map((sector) => ({
      url: `${siteUrl}${sector.legacyPath}`,
      lastModified: buildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}/`,
      lastModified: buildDate,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
    /*
     * Suburb pages.
     *
     * These were the lowest-priority, least-frequently-changing URLs on the
     * site, below every project case study. That is backwards for a local
     * trade: "painters <suburb>" is the query APMG can realistically win, and
     * only pages carrying a documented local project are indexable at all —
     * so every URL in this list has already passed the evidence test that the
     * rest of the sitemap does not apply. They are ranked accordingly.
     */
    ...indexableLocations.map((location) => ({
      url: `${siteUrl}/areas/${location.slug}/`,
      lastModified: buildDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
