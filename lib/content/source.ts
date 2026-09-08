import { unstable_cache } from 'next/cache';
import { hasSupabase } from '@/lib/supabase/env';
import { collectionSchemas, type Collection, type EntryOf } from './schemas';
import { contentTag } from './tags';
import type { Post, Project, Service } from './types';
import { projects as seedProjects } from '@/content/projects';
import { services as seedServices } from '@/content/services';

/**
 * The content adapter.
 *
 * Every page reads through here. With Supabase configured, rows come from
 * `content_entries` behind a cache tagged per collection and never expiring
 * on a timer: the admin save action expires it. Without Supabase, the
 * TypeScript files answer, so tests, the sandbox and a fresh clone need no
 * database.
 */

const seeds: { [C in Collection]: readonly EntryOf<C>[] } = {
  projects: seedProjects as readonly EntryOf<'projects'>[],
  services: seedServices as readonly EntryOf<'services'>[],
  posts: [],
};

type Row = { slug: string; status: 'draft' | 'published'; data: unknown };

function parseRows<C extends Collection>(collection: C, rows: Row[]): EntryOf<C>[] {
  const schema = collectionSchemas[collection];
  const out: EntryOf<C>[] = [];
  for (const row of rows) {
    const result = schema.safeParse(row.data);
    if (result.success) out.push(result.data as EntryOf<C>);
    else
      console.warn(`[content] ${collection}/${row.slug} failed validation`, result.error.flatten());
  }
  return out;
}

async function fetchPublished<C extends Collection>(collection: C): Promise<EntryOf<C>[]> {
  const { createServerSupabase } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('content_entries')
    .select('slug, status, data')
    .eq('collection', collection)
    .eq('status', 'published')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`[content] ${collection}: ${error.message}`);
  return parseRows(collection, (data ?? []) as Row[]);
}

function cachedCollection<C extends Collection>(collection: C) {
  return unstable_cache(() => fetchPublished(collection), ['content', collection], {
    tags: [contentTag(collection)],
    revalidate: false,
  });
}

async function all<C extends Collection>(collection: C): Promise<EntryOf<C>[]> {
  if (!hasSupabase()) return [...seeds[collection]];
  return cachedCollection(collection)();
}

// --- Projects --------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  return all('projects');
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return (await getProjects()).find((p) => p.slug === slug);
}

export async function getFeaturedProjects(): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.isFeatured);
}

export async function getProjectsForSector(sectorSlug: string): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.sectorSlug === sectorSlug);
}

// --- Services --------------------------------------------------------------

export async function getServices(): Promise<Service[]> {
  return all('services');
}

export async function getService(slug: string): Promise<Service | undefined> {
  return (await getServices()).find((s) => s.slug === slug);
}

// --- Posts -----------------------------------------------------------------

export async function getPosts(): Promise<Post[]> {
  const posts = await all('posts');
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getPosts()).find((p) => p.slug === slug);
}

// --- Admin -----------------------------------------------------------------

/** Uncached. Includes drafts. Only the admin preview and editor call this. */
export async function getEntryForPreview<C extends Collection>(
  collection: C,
  slug: string,
): Promise<{ status: 'draft' | 'published'; data: EntryOf<C> } | undefined> {
  if (!hasSupabase()) {
    const seed = seeds[collection].find((e) => e.slug === slug);
    return seed ? { status: 'published', data: seed as EntryOf<C> } : undefined;
  }
  const { createServerSupabase } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('content_entries')
    .select('slug, status, data')
    .eq('collection', collection)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`[content] ${collection}/${slug}: ${error.message}`);
  if (!data) return undefined;
  const parsed = collectionSchemas[collection].safeParse(data.data);
  if (!parsed.success) return undefined;
  return { status: data.status as 'draft' | 'published', data: parsed.data as EntryOf<C> };
}
