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
      {
        // Named explicitly so a later blanket rule cannot quietly lock the
        // answer engines out. A blocked crawler cannot cite APMG, and for a
        // local trade business an AI answer is now a real referral source.
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          'PerplexityBot',
          'ClaudeBot',
          'Claude-User',
          'anthropic-ai',
          'Google-Extended',
          'Applebot-Extended',
          'Bingbot',
        ],
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
