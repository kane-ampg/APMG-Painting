import type { NextConfig } from 'next';
import generated from './content/locations.generated.json';

/**
 * Sandbox note: this build is a review environment, not production.
 * `SANDBOX_NOINDEX` defaults to on so the mock-up can never be indexed
 * alongside the live apmgpainting.com.au. It must be switched off
 * deliberately at go-live.
 */

/**
 * Sandbox guard, duplicated from lib/site.ts on purpose.
 *
 * Next's config loader does not apply the `@/*` tsconfig path mapping, and
 * reaching into the app's module graph from the config is avoidable risk for a
 * one-line predicate. tests/unit/sandbox-lockdown.test.ts asserts this and
 * lib/site.ts's `isSandbox` agree for every value, so they cannot drift.
 */
const isSandbox = process.env.NEXT_PUBLIC_SANDBOX !== 'false';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Every legacy URL ends in a slash. Keeping that avoids 101 needless redirects.
  trailingSlash: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apmgpainting.com.au',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },

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

  async redirects() {
    /*
     * Legacy suburb URLs.
     *
     * The live WordPress site publishes 68 suburb pages at
     * /areas/painters-{suburb}/. Only 7 of them carry a legacyPath anywhere in
     * this repo, so a hand-written list would silently drop the other ~61 —
     * indexed URLs with real equity behind them.
     *
     * Generated from the locality data instead: deriving the table covers the
     * set by construction rather than by someone remembering to add a line.
     *
     * Victoria only. A /areas/painters-{suburb}/ URL never referred to a
     * Queensland suburb, and pointing one at Queensland would invent a
     * redirect for a URL that was never published.
     *
     * `permanent: true` is a 308, which search engines treat as a 301 for
     * consolidation purposes but which also preserves the request method.
     */
    const legacySuburbs = generated.localities
      .filter((l) => l.state === 'VIC')
      .map((l) => ({
        source: `/areas/painters-${l.slug}`,
        destination: `/areas/victoria/${l.regionSlug}/${l.slug}/`,
        permanent: true,
      }));

    return [
      // Slug corrections (duplicate + misspelled), ahead of the generated
      // table: these sources have no locality of their own, so nothing below
      // would match them. Destinations verified against
      // content/locations.generated.json directly — the region slugs for
      // travancore (western) and gardenvale (inner-melbourne) do not match
      // the naive assumption, so they are spelled out here rather than
      // guessed.
      {
        source: '/areas/painters-park-dale',
        destination: '/areas/victoria/bayside-and-peninsula/parkdale/',
        permanent: true,
      },
      {
        source: '/areas/painters-travencore',
        destination: '/areas/victoria/western/travancore/',
        permanent: true,
      },
      {
        source: '/areas/painters-garden-vale',
        destination: '/areas/victoria/inner-melbourne/gardenvale/',
        permanent: true,
      },
      ...legacySuburbs,
      // No other route renames. /about-us/ and /contact-us/ keep their URLs —
      // they are indexed and a rebuild is not a reason to move them.
    ];
  },
};

export default nextConfig;
