import { afterEach, describe, expect, it, vi } from 'vitest';

// Hoisted so the vi.mock factory below (itself hoisted above these imports)
// can close over it. Recording the call lets tests assert on the cache key,
// tags and revalidate config actually passed to unstable_cache, not just
// that the wrapped function still runs.
const { unstableCache } = vi.hoisted(() => ({
  unstableCache: vi.fn((...args: unknown[]) => args[0] as (...a: unknown[]) => unknown),
}));

vi.mock('next/cache', () => ({
  unstable_cache: (...args: unknown[]) => unstableCache(...args),
}));

describe('content source without Supabase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('falls back to the TypeScript projects', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { getProjects, getProject } = await import('@/lib/content/source');
    const { projects } = await import('@/content/projects');
    expect(await getProjects()).toEqual(projects);
    expect((await getProject(projects[0]!.slug))?.title).toBe(projects[0]!.title);
  });

  it('returns no posts when there is no database', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { getPosts } = await import('@/lib/content/source');
    expect(await getPosts()).toEqual([]);
  });

  it('names one tag per collection', async () => {
    const { contentTag } = await import('@/lib/content/tags');
    expect(contentTag('projects')).toBe('content:projects');
  });
});

describe('content source with Supabase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock('@/lib/supabase/server');
    unstableCache.mockClear();
  });

  it('parses published rows and drops rows that fail the schema', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    const rows = [
      {
        slug: 'first-post',
        status: 'published',
        data: {
          slug: 'first-post',
          title: 'First post',
          excerpt: 'Short.',
          body: '# Hello',
          publishedAt: '2026-09-08',
          author: 'APMG Painting',
          tags: [],
          metaTitle: 'First post',
          metaDescription: 'Fine.',
        },
      },
      { slug: 'broken', status: 'published', data: { slug: 'broken' } },
    ];
    vi.doMock('@/lib/supabase/server', () => ({
      createServerSupabase: async () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({ order: async () => ({ data: rows, error: null }) }),
            }),
          }),
        }),
      }),
    }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getPosts } = await import('@/lib/content/source');
    const posts = await getPosts();
    expect(posts.map((p) => p.slug)).toEqual(['first-post']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('broken'), expect.anything());
  });

  it('falls back to the default business details when the read fails', async () => {
    // fetchPublished throws on a query error, and getSiteSettings is awaited
    // by the root layout and by the enquiry action. A network blip or an RLS
    // misconfiguration must not fail a page render or cost somebody their
    // enquiry, so these two getters catch where the others deliberately do not.
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.doMock('@/lib/supabase/server', () => ({
      createServerSupabase: async () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({ order: async () => ({ data: null, error: { message: 'boom' } }) }),
            }),
          }),
        }),
      }),
    }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getSiteSettings, getPage } = await import('@/lib/content/source');
    const { defaultContactPage, defaultSiteSettings } = await import('@/lib/site');

    await expect(getSiteSettings()).resolves.toEqual(defaultSiteSettings);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('settings read failed'),
      expect.anything(),
    );

    await expect(getPage('contact-us')).resolves.toEqual(defaultContactPage);
    warn.mockRestore();
  });

  it('still fails loudly for projects, which should break a build', async () => {
    // The counterpart to the test above: only the singletons swallow a read
    // error, because only they have something safe to fall back to.
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.doMock('@/lib/supabase/server', () => ({
      createServerSupabase: async () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({ order: async () => ({ data: null, error: { message: 'boom' } }) }),
            }),
          }),
        }),
      }),
    }));
    const { getProjects } = await import('@/lib/content/source');
    await expect(getProjects()).rejects.toThrow(/boom/);
  });

  it('tags the posts cache and never expires it on a timer', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.doMock('@/lib/supabase/server', () => ({
      createServerSupabase: async () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({ order: async () => ({ data: [], error: null }) }),
            }),
          }),
        }),
      }),
    }));
    const { getPosts } = await import('@/lib/content/source');
    await getPosts();
    expect(unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      expect.arrayContaining(['posts']),
      { tags: ['content:posts'], revalidate: false },
    );
  });
});
