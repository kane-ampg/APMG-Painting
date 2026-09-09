import { afterEach, describe, expect, it, vi } from 'vitest';

const updateTag = vi.fn();
const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({ updateTag, revalidatePath }));
vi.mock('@/lib/auth/admin', () => ({ requireAdmin: async () => ({ email: 'kaner@simple.biz' }) }));

const upsert = vi.fn(async () => ({ error: null }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: async () => ({ from: () => ({ upsert }) }),
}));

describe('saveEntry', () => {
  afterEach(() => vi.clearAllMocks());

  const form = (over: Record<string, string>) => {
    const fd = new FormData();
    fd.set('collection', 'services');
    fd.set('slug', 'interior-painting');
    fd.set('status', 'published');
    fd.set(
      'data',
      JSON.stringify({
        slug: 'interior-painting',
        title: 'Interior painting',
        shortTitle: 'Interior',
        audience: 'commercial',
        summary: 'Staged so the space keeps working.',
        body: ['One.'],
        includes: ['Walls'],
      }),
    );
    for (const [k, v] of Object.entries(over)) fd.set(k, v);
    return fd;
  };

  it('validates, upserts, and expires the collection tag on publish', async () => {
    const { saveEntry } = await import('@/app/actions/content');
    const result = await saveEntry({ status: 'idle' }, form({}));
    expect(result.status).toBe('ok');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'services',
        slug: 'interior-painting',
        status: 'published',
        updated_by: 'kaner@simple.biz',
      }),
      { onConflict: 'collection,slug' },
    );
    expect(updateTag).toHaveBeenCalledWith('content:services');
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
  });

  it('returns field errors instead of saving invalid data', async () => {
    const { saveEntry } = await import('@/app/actions/content');
    const result = await saveEntry(
      { status: 'idle' },
      form({ data: JSON.stringify({ slug: 'Nope' }) }),
    );
    expect(result.status).toBe('error');
    expect(result.fieldErrors?.title).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rejects an unknown collection', async () => {
    const { saveEntry } = await import('@/app/actions/content');
    const result = await saveEntry({ status: 'idle' }, form({ collection: 'sectors' }));
    expect(result.status).toBe('error');
  });
});
