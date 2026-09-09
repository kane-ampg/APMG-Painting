import type { NextConfig } from 'next';
import generated from './content/locations.generated.json';
import { appRole } from './lib/app-role';
import { supabaseHostname } from './lib/supabase/env';

const supabaseHost = supabaseHostname();

// Which deployment this build is (spec §8a). Read once at build time so the
// role-based redirects below cost the public site nothing at request time.
const role = appRole();
const editorOrigin = process.env.EDITOR_ORIGIN ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Every legacy URL ends in a slash. Keeping that avoids 101 needless redirects.
  trailingSlash: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    // Source objects are immutable (hashed names, one-year Cache-Control),
    // so the optimised variants can be cached for the same year.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apmgpainting.com.au',
        pathname: '/wp-content/uploads/**',
      },
      ...(supabaseHost
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHost,
              pathname: '/storage/v1/object/public/media/**',
            },
          ]
        : []),
    ],
  },

  /**
   * The header-level half of the editor lockdown.
   *
   * Go-live removed the unconditional X-Robots-Tag that used to sit here. It
   * comes back only on the editor deployment, where it must agree with the
   * other three layers (`noindexAll` in lib/site.ts): a header-level noindex
   * overrides everything, so all four have to switch together.
   */
  async headers() {
    if (role !== 'editor') return [];

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
      ...(role === 'editor'
        ? [
            // The editor deployment serves nothing public. Every other path
            // lands on the admin.
            { source: '/', destination: '/admin/', permanent: false },
            {
              source:
                '/:path((?!admin|api|_next|favicon\\.ico|icon\\.png|apple-icon\\.png|images).*)',
              destination: '/admin/',
              permanent: false,
            },
          ]
        : editorOrigin
          ? [
              // The public site sends anyone who types /admin to the editor.
              {
                source: '/admin/:path*',
                destination: `${editorOrigin}/admin/:path*`,
                permanent: false,
              },
            ]
          : [
              // No editor configured yet: /admin does not exist on the site.
              { source: '/admin/:path*', destination: '/', permanent: false },
            ]),
    ];
  },
};

export default nextConfig;
