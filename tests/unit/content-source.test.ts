import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
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
});
