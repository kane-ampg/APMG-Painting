'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import {
  collectionSchemas,
  isCollection,
  isSingleton,
  singletonSlug,
  slugSchema,
} from '@/lib/content/schemas';
import { contentTag } from '@/lib/content/tags';
import { notifyPublicSite } from '@/lib/revalidate/notify';
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
    case 'settings':
      // Business details are stated in the header, the footer, the chat and
      // the JSON-LD, which is every page — the layout revalidation below is
      // what actually covers it. These are the pages that name them in prose.
      return ['/', '/contact-us/', '/about-us/', '/llms.txt'];
    case 'pages':
      return [`/${slug}/`];
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

  // A singleton's slug is fixed and never submitted — the settings schema has
  // no `slug` field at all, so the form posts an empty one. Settle that here,
  // before the slug checks below, and treat a rename as impossible: there is
  // only ever one row per singleton collection.
  const singleton = isSingleton(collection);

  // The slug the entry was loaded with, empty for a brand-new entry. Renaming
  // an entry must update its existing row in place rather than upsert a new
  // one keyed on the new slug, which would fork the row and strand the old
  // one (and its public page) untouched.
  const originalSlugRaw = singleton ? '' : String(formData.get('originalSlug') ?? '');
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

  // Force the fixed slug onto the payload. Harmless where the schema has no
  // `slug` field (settings): Zod strips the unknown key.
  if (singleton && typeof raw === 'object' && raw !== null) {
    (raw as Record<string, unknown>).slug = singletonSlug[collection];
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

  // `settings` has no `slug` field, so the union of parsed shapes does not
  // always carry one. A singleton takes its fixed slug; every other
  // collection's schema requires one, hence the cast on that branch.
  const slug = singleton ? singletonSlug[collection] : (parsed.data as { slug: string }).slug;
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
    // The header, the footer and the LocalBusiness JSON-LD all state business
    // details and all live in the root layout, so a settings change has to
    // expire every page, not just the ones that name the address in prose.
    if (collection === 'settings') revalidatePath('/', 'layout');
    const paths = [...pathsFor(collection, slug)];
    if (isRename) {
      // The old slug's page (and anything else keyed off it) must come down
      // too, or the rename leaves a stranded copy live.
      paths.push(...pathsFor(collection, originalSlug as string));
    }
    paths.push('/sitemap.xml', '/llms.txt');
    for (const path of paths) revalidatePath(path);

    // The editor deployment has no local cache to speak of — its readers are
    // the site's, not the editor's — so tell the public site what to expire
    // too. On the site role this is a no-op; updateTag already ran above.
    const remote = await notifyPublicSite({
      tags: [contentTag(collection)],
      paths,
      // The remote endpoint has to be told the depth as well as the path:
      // `revalidatePath('/')` alone expires the homepage, not every page
      // whose header and footer state the business details. Without this a
      // settings publish was stale-while-revalidate on the live site.
      ...(collection === 'settings' ? { layoutPaths: ['/'] } : {}),
    });
    revalidatePath(`/admin/${collection}/`);
    if (!remote.ok) return { status: 'error', message: remote.message };
  } else {
    revalidatePath(`/admin/${collection}/`);
  }

  return {
    status: 'ok',
    message: status === 'published' ? 'Published. Live within a few seconds.' : 'Draft saved.',
  };
}

export async function deleteEntry(collection: string, slug: string): Promise<void> {
  await requireAdmin();
  if (!isCollection(collection)) throw new Error('Unknown collection');
  // There is nothing to fall back to: a deleted settings row would take the
  // site's phone number with it until somebody re-created it.
  if (isSingleton(collection)) throw new Error('Singletons cannot be deleted');
  slugSchema.parse(slug);
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('content_entries').delete().match({ collection, slug });
  if (error) throw new Error(error.message);
  updateTag(contentTag(collection));
  const paths = [...pathsFor(collection, slug), '/sitemap.xml', '/llms.txt'];
  for (const path of paths) revalidatePath(path);

  // No `layoutPaths` here: `isSingleton` above has already refused, so by
  // this line TypeScript knows `collection` cannot be `settings` — the only
  // collection whose content lives in a layout.
  const remote = await notifyPublicSite({ tags: [contentTag(collection)], paths });
  revalidatePath(`/admin/${collection}/`);
  if (!remote.ok) throw new Error(remote.message);
}
