import { afterEach, describe, expect, it, vi } from 'vitest';

describe('notifyPublicSite', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('is a no-op on the site role', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'site');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { notifyPublicSite } = await import('@/lib/revalidate/notify');
    expect(await notifyPublicSite({ tags: ['content:posts'], paths: ['/blog/'] })).toEqual({
      ok: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts tags and paths with the bearer secret from the editor', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'editor');
    vi.stubEnv('PUBLIC_SITE_ORIGIN', 'https://apmgpainting.com.au');
    vi.stubEnv('REVALIDATE_SECRET', 's3cret');
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { notifyPublicSite } = await import('@/lib/revalidate/notify');
    const result = await notifyPublicSite({ tags: ['content:posts'], paths: ['/blog/'] });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://apmgpainting.com.au/api/revalidate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer s3cret' }),
        body: JSON.stringify({ tags: ['content:posts'], paths: ['/blog/'] }),
      }),
    );
  });

  it('reports failure without throwing', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'editor');
    vi.stubEnv('PUBLIC_SITE_ORIGIN', 'https://apmgpainting.com.au');
    vi.stubEnv('REVALIDATE_SECRET', 's3cret');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('no', { status: 500 })),
    );
    const { notifyPublicSite } = await import('@/lib/revalidate/notify');
    const result = await notifyPublicSite({ tags: [], paths: ['/'] });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/live site did not refresh/i);
  });
});
