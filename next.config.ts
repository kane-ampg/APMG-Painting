import type { NextConfig } from 'next';
import { supabaseHostname } from './lib/supabase/env';

/**
 * Sandbox note: this build is a review environment, not production.
 * `SANDBOX_NOINDEX` defaults to on so the mock-up can never be indexed
 * alongside the live apmgpainting.com.au. It must be switched off
 * deliberately at go-live.
 */

const supabaseHost = supabaseHostname();

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
    ];
  },
};

export default nextConfig;
