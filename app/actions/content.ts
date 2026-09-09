'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { collectionSchemas, isCollection, slugSchema } from '@/lib/content/schemas';
import { contentTag } from '@/lib/content/tags';
import { createServerSupabase } from '@/lib/supabase/server';

export type SaveState = {
  status: 'idle' | 'ok' | 'error';
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Public paths that show a given entry, for precise revalidation. */
function pathsFor(collection: string, slug: string): string[] {
  switch (collection) {
    case 'projects':
      return ['/projects/', `/projects/${slug}/`, '/'];
    case 'services':
      return ['/commercial/', '/trade-services/', '/'];
    case 'posts':
      return ['/blog/', `/blog/${slug}/`];
    default:
      return [];
  }
}

export async function saveEntry(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { email } = await requireAdmin();

  const collection = String(formData.get('collection') ?? '');
  if (!isCollection(collection)) return { status: 'error', message: 'Unknown collection.' };

  const status = formData.get('status') === 'published' ? 'published' : 'draft';
  // What the entry's status was before this save. Needed so that moving a
  // published entry back to draft still expires its public cache entry —
  // otherwise the live page would keep serving stale content forever.
  const previousStatus = formData.get('previousStatus') === 'published' ? 'published' : 'draft';

  // The slug the entry was loaded with, empty for a brand-new entry. Renaming
  // an entry must update its existing row in place rather than upsert a new
  // one keyed on the new slug, which would fork the row and strand the old
  // one (and its public page) untouched.
  const originalSlugRaw = String(formData.get('originalSlug') ?? '');
  let originalSlug: string | null = null;
  if (originalSlugRaw !== '') {
    const parsedOriginalSlug = slugSchema.safeParse(originalSlugRaw);
    if (!parsedOriginalSlug.success) {
      return { status: 'error', message: 'The original slug is invalid. Reload and try again.' };
    }
    originalSlug = parsedOriginalSlug.data;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('data') ?? '{}'));
  } catch {
    return { status: 'error', message: 'The form produced invalid JSON. Reload and try again.' };
  }

  if (collection === 'posts' && typeof raw === 'object' && raw !== null) {
    (raw as Record<string, unknown>).updatedAt = new Date().toISOString().slice(0, 10);
  }

  const parsed = collectionSchemas[collection].safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Fix the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const slug = parsed.data.slug;
  const isRename = originalSlug !== null && originalSlug !== slug;
  const supabase = await createServerSupabase();

  if (isRename) {
    const { error } = await supabase
      .from('content_entries')
      .update({
        slug,
        status,
        data: parsed.data,
        updated_by: email,
        updated_at: new Date().toISOString(),
      })
      .match({ collection, slug: originalSlug });
    if (error) return { status: 'error', message: `Could not save: ${error.message}` };
  } else {
    const { error } = await supabase.from('content_entries').upsert(
      {
        collection,
        slug,
        status,
        data: parsed.data,
        updated_by: email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'collection,slug' },
    );
    if (error) return { status: 'error', message: `Could not save: ${error.message}` };
  }

  // Drafts never reach the public cache. Expire it on a publish, and also
  // when a previously published entry drops back to draft — its live page
  // has to come down, not just stay stale.
  if (status === 'published' || previousStatus === 'published') {
    updateTag(contentTag(collection));
    for (const path of pathsFor(collection, slug)) revalidatePath(path);
    if (isRename) {
      // The old slug's page (and anything else keyed off it) must come down
      // too, or the rename leaves a stranded copy live.
      for (const path of pathsFor(collection, originalSlug as string)) revalidatePath(path);
    }
    revalidatePath('/sitemap.xml');
    revalidatePath('/llms.txt');
  }
  revalidatePath(`/admin/${collection}/`);

  return {
    status: 'ok',
    message: status === 'published' ? 'Published. Live within a few seconds.' : 'Draft saved.',
  };
}

export async function deleteEntry(collection: string, slug: string): Promise<void> {
  await requireAdmin();
  if (!isCollection(collection)) throw new Error('Unknown collection');
  slugSchema.parse(slug);
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('content_entries').delete().match({ collection, slug });
  if (error) throw new Error(error.message);
  updateTag(contentTag(collection));
  for (const path of pathsFor(collection, slug)) revalidatePath(path);
  revalidatePath('/sitemap.xml');
  revalidatePath('/llms.txt');
  revalidatePath(`/admin/${collection}/`);
}
