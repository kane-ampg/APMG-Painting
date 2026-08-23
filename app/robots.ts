import type { MetadataRoute } from 'next';
import { isSandbox, siteUrl } from '@/lib/site';

/**
 * Robots.
 *
 * The live WordPress site's /robots.txt returns HTTP 500, so Google currently
 * receives no directives at all.
 *
 * While NEXT_PUBLIC_SANDBOX is not explicitly "false", this disallows
 * everything — a preview build must never be crawled alongside the live site.
 */
export default function robots(): MetadataRoute.Robots {
  if (isSandbox) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
