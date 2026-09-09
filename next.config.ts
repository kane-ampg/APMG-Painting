import type { NextConfig } from 'next';
import { appRole } from './lib/app-role';
import { supabaseHostname } from './lib/supabase/env';

/**
 * Sandbox note: this build is a review environment, not production.
 * `SANDBOX_NOINDEX` defaults to on so the mock-up can never be indexed
 * alongside the live apmgpainting.com.au. It must be switched off
 * deliberately at go-live.
 */

const supabaseHost = supabaseHostname();

// Which deployment this build is (spec §8a). Read once at build time so the
// role-based redirects below cost the public site nothing at request time.
const role = appRole();
const editorOrigin = process.env.EDITOR_ORIGIN ?? '';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    // The public site and the editor are two root layouts (route group
    // `(site)` and `admin/`), so there is no single layout for Next to
    // compose a root `not-found.tsx` into — the documented case for
    // `app/global-not-found.tsx`. Without this flag an unmatched URL falls
    // back to Next's own unstyled 404, and the live site's every-URL-500
    // problem would only be half fixed.
    globalNotFound: true,
  },

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

  async headers() {
    return [
      {
        // Belt and braces: a header-level noindex on the whole sandbox.
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
