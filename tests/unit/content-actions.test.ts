import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const updateTag = vi.fn();
const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({ updateTag, revalidatePath }));
vi.mock('@/lib/auth/admin', () => ({ requireAdmin: async () => ({ email: 'kaner@simple.biz' }) }));

const upsert = vi.fn(async () => ({ error: null }));
const match = vi.fn(async () => ({ error: null }));
const update = vi.fn(() => ({ match }));
const del = vi.fn(() => ({ match }));

// `saveEntry` reads the row's current status before writing, and uses that
// — not the form's hidden `previousStatus` — to decide whether the public
// cache has to be expired. `storedStatus` is what the database "holds".
let storedStatus: 'draft' | 'published' | null = null;
let selectError: { message: string } | null = null;
const selectMatch = vi.fn(() => ({
  maybeSingle: async () => ({
    data: storedStatus === null ? null : { status: storedStatus },
    error: selectError,
  }),
}));
const select = vi.fn(() => ({ match: selectMatch }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: async () => ({
    from: () => ({ upsert, update, delete: del, select }),
  }),
}));

describe('saveEntry', () => {
  beforeEach(() => {
    storedStatus = 'published';
    selectError = null;
  });
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

  it('renames the row in place when the slug changes, keyed on originalSlug', async () => {
    const { saveEntry } = await import('@/app/actions/content');
    const fd = new FormData();
    fd.set('collection', 'projects');
    fd.set('status', 'published');
    fd.set('previousStatus', 'published');
    fd.set('originalSlug', 'interior-painting');
    fd.set(
      'data',
      JSON.stringify({
        slug: 'interior-repaints',
        title: 'Interior repaints',
        clientOrPropertyType: 'Office',
        location: 'Melbourne',
        sectorSlug: 'commercial-offices',
        challenge: 'Repaint while the office stayed occupied.',
        scopeOfWork: ['Walls and ceilings'],
        images: [],
        outcome: ['Repainted without disrupting staff.'],
        relatedServiceSlugs: [],
        relatedLocationSlugs: [],
        isFeatured: false,
      }),
    );

    const result = await saveEntry({ status: 'idle' }, fd);
    expect(result.status).toBe('ok');
    expect(upsert).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'interior-repaints',
        status: 'published',
        updated_by: 'kaner@simple.biz',
      }),
    );
    expect(match).toHaveBeenCalledWith({ collection: 'projects', slug: 'interior-painting' });
    // The status read is keyed on the slug the row still has, not the new one.
    expect(selectMatch).toHaveBeenCalledWith({
      collection: 'projects',
      slug: 'interior-painting',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/projects/interior-painting/');
    expect(revalidatePath).toHaveBeenCalledWith('/projects/interior-repaints/');
  });

  it('expires the cache tag when a published entry is saved back as a draft', async () => {
    storedStatus = 'published';
    const { saveEntry } = await import('@/app/actions/content');
    const result = await saveEntry({ status: 'idle' }, form({ status: 'draft' }));
    expect(result.status).toBe('ok');
    expect(selectMatch).toHaveBeenCalledWith({
      collection: 'services',
      slug: 'interior-painting',
    });
    expect(updateTag).toHaveBeenCalledWith('content:services');
  });

  it('does not expire the cache tag when a draft is saved as a draft', async () => {
    storedStatus = 'draft';
    const { saveEntry } = await import('@/app/actions/content');
    const result = await saveEntry({ status: 'idle' }, form({ status: 'draft' }));
    expect(result.status).toBe('ok');
    expect(updateTag).not.toHaveBeenCalled();
  });

  it('trusts the stored status over the form, in both directions', async () => {
    // The hidden `previousStatus` field is whatever the browser was holding
    // when the page loaded. A second editor publishing, or a stale tab being
    // submitted, makes it a lie — and the lie costs either a live page that
    // never comes down or a needless site-wide rebuild.
    const { saveEntry } = await import('@/app/actions/content');

    storedStatus = 'published';
    await saveEntry({ status: 'idle' }, form({ status: 'draft', previousStatus: 'draft' }));
    expect(updateTag).toHaveBeenCalledWith('content:services');

    vi.clearAllMocks();
    storedStatus = 'draft';
    await saveEntry({ status: 'idle' }, form({ status: 'draft', previousStatus: 'published' }));
    expect(updateTag).not.toHaveBeenCalled();
  });

  it('treats a brand-new entry as never having been published', async () => {
    storedStatus = null;
    const { saveEntry } = await import('@/app/actions/content');
    await saveEntry({ status: 'idle' }, form({ status: 'draft' }));
    expect(updateTag).not.toHaveBeenCalled();
  });

  it('reports an error and writes nothing when the status read fails', async () => {
    selectError = { message: 'connection reset' };
    const { saveEntry } = await import('@/app/actions/content');
    const result = await saveEntry({ status: 'idle' }, form({}));
    expect(result.status).toBe('error');
    expect(result.message).toBe('Could not save: connection reset');
    expect(upsert).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

describe('saveEntry on a singleton', () => {
  beforeEach(() => {
    storedStatus = 'published';
    selectError = null;
  });
  afterEach(() => vi.clearAllMocks());

  /**
   * The settings schema has no `slug` field, so the editor form posts an
   * empty `slug` and an empty `originalSlug`. Neither may be treated as a
   * rename, and the row's slug is the fixed one regardless of what arrives.
   */
  const settingsForm = () => {
    const fd = new FormData();
    fd.set('collection', 'settings');
    fd.set('slug', '');
    fd.set('originalSlug', '');
    fd.set('status', 'published');
    fd.set('previousStatus', 'published');
    fd.set(
      'data',
      JSON.stringify({
        phone: '1300 97 97 40',
        email: 'info@apmgpainting.com.au',
        address: {
          street: '1 Turbo Drive',
          suburb: 'Bayswater North',
          state: 'VIC',
          postcode: '3153',
          country: 'AU',
          effectiveFrom: null,
        },
        previousAddress: null,
        abn: null,
        coords: null,
        openingHours: null,
        serviceAreaPrimary: 'Melbourne, Victoria',
        social: { instagram: null, facebook: null, google: null },
      }),
    );
    return fd;
  };

  it('upserts the fixed slug and never treats the save as a rename', async () => {
    const { saveEntry } = await import('@/app/actions/content');
    const result = await saveEntry({ status: 'idle' }, settingsForm());
    expect(result.status).toBe('ok');
    expect(update).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'settings', slug: 'site', status: 'published' }),
      { onConflict: 'collection,slug' },
    );
  });

  it('expires every page, because the layout states the business details', async () => {
    const { saveEntry } = await import('@/app/actions/content');
    await saveEntry({ status: 'idle' }, settingsForm());
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePath).toHaveBeenCalledWith('/contact-us/');
    expect(revalidatePath).toHaveBeenCalledWith('/llms.txt');
  });

  it('rejects an ABN that is not eleven digits, and saves nothing', async () => {
    const { saveEntry } = await import('@/app/actions/content');
    const fd = settingsForm();
    fd.set('data', JSON.stringify({ ...JSON.parse(String(fd.get('data'))), abn: '1234' }));
    const result = await saveEntry({ status: 'idle' }, fd);
    expect(result.status).toBe('error');
    expect(result.fieldErrors?.abn).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('refuses to delete a singleton', async () => {
    const { deleteEntry } = await import('@/app/actions/content');
    await expect(deleteEntry('settings', 'site')).rejects.toThrow(/cannot be deleted/i);
    await expect(deleteEntry('pages', 'contact-us')).rejects.toThrow(/cannot be deleted/i);
    expect(del).not.toHaveBeenCalled();
  });
});
