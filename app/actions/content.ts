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
  const supabase = await createServerSupabase();
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

  // Drafts never reach the public cache, so only a publish expires it.
  if (status === 'published') {
    updateTag(contentTag(collection));
    for (const path of pathsFor(collection, slug)) revalidatePath(path);
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
  revalidatePath(`/admin/${collection}/`);
}
