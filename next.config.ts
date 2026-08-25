import type { NextConfig } from 'next';

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
    return [
      // --- Suburb slug corrections (duplicate + misspelled) ---
      {
        source: '/areas/painters-park-dale',
        destination: '/areas/painters-parkdale',
        permanent: true,
      },
      {
        source: '/areas/painters-travencore',
        destination: '/areas/painters-travancore',
        permanent: true,
      },
      {
        source: '/areas/painters-garden-vale',
        destination: '/areas/painters-gardenvale',
        permanent: true,
      },
      // No other route renames. /about-us/ and /contact-us/ keep their URLs —
      // they are indexed and a rebuild is not a reason to move them.
    ];
  },
};

export default nextConfig;
