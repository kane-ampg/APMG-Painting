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
    { path: '/residential-painting/', priority: 0.9 },
    { path: '/office-painters/', priority: 0.8 },
    { path: '/projects/', priority: 0.8 },
    { path: '/trade-services/', priority: 0.6 },
    { path: '/about-us/', priority: 0.5 },
    { path: '/contact-us/', priority: 0.7 },
    { path: '/areas/', priority: 0.5 },
  ];

  const lastModified = new Date();

  return [
    ...staticPaths.map((entry) => ({
      url: `${siteUrl}${entry.path}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: entry.priority,
    })),
    ...sectors.map((sector) => ({
      url: `${siteUrl}${sector.legacyPath}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}/`,
      lastModified,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
    ...indexableLocations.map((location) => ({
      url: `${siteUrl}/areas/${location.slug}/`,
      lastModified,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    })),
  ];
}
