import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The editor deployment's lockdown, tested in both states.
 *
 * Go-live released the four sandbox layers together (meta robots, robots.txt,
 * llms.txt and the X-Robots-Tag header). The editor deployment turns all four
 * back on, because it serves only /admin/* and must never be indexed beside
 * the live site. A header-level noindex overrides everything, so the header
 * and the other three have to agree — which is what this asserts.
 */
describe('editor deployment noindex layers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function layers(role: string) {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', role);
    vi.resetModules();

    const { noindexAll } = await import('@/lib/site');
    const { default: robots } = await import('@/app/robots');
    const { buildMetadata } = await import('@/lib/seo/metadata');
    const { default: nextConfig } = await import('../../next.config');

    const headers = (await nextConfig.headers?.()) ?? [];

    return {
      noindexAll,
      robotsDisallowsEverything: robots().rules,
      metaIndex: (
        buildMetadata({ title: 't', description: 'd', path: '/' }).robots as {
          index: boolean;
        }
      ).index,
      headerNames: headers.flatMap((entry) => entry.headers.map((h) => h.key)),
    };
  }

  it('locks all four layers down on the editor', async () => {
    const l = await layers('editor');

    expect(l.noindexAll).toBe(true);
    expect(l.robotsDisallowsEverything).toEqual([{ userAgent: '*', disallow: '/' }]);
    expect(l.metaIndex).toBe(false);
    expect(l.headerNames).toContain('X-Robots-Tag');
  });

  it('releases all four on the public site', async () => {
    const l = await layers('site');

    expect(l.noindexAll).toBe(false);
    expect(JSON.stringify(l.robotsDisallowsEverything)).toContain('/api/');
    expect(l.metaIndex).toBe(true);
    expect(l.headerNames).not.toContain('X-Robots-Tag');
  });

  it('serves llms.txt only on the public site', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'editor');
    vi.resetModules();
    const { GET } = await import('@/app/llms.txt/route');
    expect((await GET()).status).toBe(404);
  });
});
