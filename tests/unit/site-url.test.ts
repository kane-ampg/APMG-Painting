// @vitest-environment node
// This file tests module-load behavior that depends on `typeof window`;
// jsdom would make every case look like a browser bundle.
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `siteUrl` is resolved once at module load, so each case has to set the
 * environment first and then re-import the module.
 */
async function resolve(env: Record<string, string | undefined>) {
  vi.resetModules();
  const previous = { ...process.env };

  for (const key of [
    'NEXT_PUBLIC_SITE_URL',
    'VERCEL_ENV',
    'VERCEL_URL',
    'VERCEL_PROJECT_PRODUCTION_URL',
  ]) {
    delete process.env[key];
  }
  Object.assign(process.env, env);

  try {
    return (await import('@/lib/site')).siteUrl;
  } finally {
    process.env = previous;
  }
}

afterEach(() => {
  vi.resetModules();
});

describe('siteUrl', () => {
  it('uses an explicit origin when one is set', async () => {
    await expect(resolve({ NEXT_PUBLIC_SITE_URL: 'https://apmgpainting.com.au' })).resolves.toBe(
      'https://apmgpainting.com.au',
    );
  });

  it('strips a trailing slash so path concatenation never doubles up', async () => {
    await expect(resolve({ NEXT_PUBLIC_SITE_URL: 'https://apmgpainting.com.au/' })).resolves.toBe(
      'https://apmgpainting.com.au',
    );
  });

  // The regression that broke the first Vercel build: a declared-but-unset
  // variable arrives as '', which `??` passes straight through to `new URL()`.
  it('treats an empty or whitespace value as absent rather than crashing', async () => {
    await expect(resolve({ NEXT_PUBLIC_SITE_URL: '' })).resolves.toBe('http://localhost:3000');
    await expect(resolve({ NEXT_PUBLIC_SITE_URL: '   ' })).resolves.toBe('http://localhost:3000');
  });

  it('assumes https for a bare domain', async () => {
    await expect(resolve({ NEXT_PUBLIC_SITE_URL: 'apmgpainting.com.au' })).resolves.toBe(
      'https://apmgpainting.com.au',
    );
  });

  it('falls back to the stable production domain on a production deployment', async () => {
    await expect(
      resolve({
        NEXT_PUBLIC_SITE_URL: '',
        VERCEL_ENV: 'production',
        VERCEL_PROJECT_PRODUCTION_URL: 'apmg-painting.vercel.app',
        VERCEL_URL: 'apmg-painting-abc123.vercel.app',
      }),
    ).resolves.toBe('https://apmg-painting.vercel.app');
  });

  // A preview must never advertise the production origin in its sitemap,
  // canonicals or JSON-LD.
  it('falls back to the per-deployment host on a preview deployment', async () => {
    await expect(
      resolve({
        VERCEL_ENV: 'preview',
        VERCEL_PROJECT_PRODUCTION_URL: 'apmg-painting.vercel.app',
        VERCEL_URL: 'apmg-painting-abc123.vercel.app',
      }),
    ).resolves.toBe('https://apmg-painting-abc123.vercel.app');
  });

  it('falls back to localhost when nothing is configured', async () => {
    await expect(resolve({})).resolves.toBe('http://localhost:3000');
  });

  // The localhost fallback exists for development. A production build that
  // reaches it would ship localhost canonicals, a localhost sitemap and
  // localhost JSON-LD with no error — so it must fail the build instead.
  it('refuses a production build with no origin configured', async () => {
    await expect(resolve({ NODE_ENV: 'production' })).rejects.toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  // The guard must be server-only. Next inlines NODE_ENV ('production') and
  // NEXT_PUBLIC_* into browser bundles but never the VERCEL_* system vars, so
  // a client bundle built on Vercel without NEXT_PUBLIC_SITE_URL resolves no
  // origin — and a module-scope throw there would crash hydration on every
  // page. lib/site.ts is in the every-page client graph via the header's
  // mobile menu. Client code only consumes `site`, so the silent localhost
  // fallback is harmless in the browser.
  it('never throws in a browser bundle, where only NEXT_PUBLIC_* vars exist', async () => {
    (globalThis as { window?: unknown }).window = {};
    try {
      await expect(resolve({ NODE_ENV: 'production' })).resolves.toBe('http://localhost:3000');
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });

  it('never produces a value that throws when passed to new URL()', async () => {
    for (const value of ['', '   ', 'not a url', '://broken']) {
      const url = await resolve({ NEXT_PUBLIC_SITE_URL: value });
      expect(() => new URL(url)).not.toThrow();
    }
  });
});
