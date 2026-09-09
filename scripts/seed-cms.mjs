/**
 * One-off seed: pushes the TypeScript content and public/images into
 * Supabase. Idempotent — re-running upserts entries and skips objects that
 * already exist. Needs SUPABASE_SERVICE_ROLE_KEY; this is the only place it
 * is ever used.
 *
 * Run: node --env-file=.env.local scripts/seed-cms.mjs
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { tsImport } from 'tsx/esm/api';

// Load the TS content and the TS media helpers through tsx so the arrays and
// the naming/URL logic both stay single-sourced with the rest of the app.
//
// `tsImport` (rather than `register('tsx/esm', ...)` from node:module) is
// what this installed tsx version documents for programmatic use: the
// generic node:module registration errors under Node 24 ("must be loaded
// with --import instead of --loader"), and even once that is worked around,
// the CJS-style fallback it uses to resolve tsconfig `paths` cannot find
// extensionless `@/...` specifiers. `tsImport` resolves both the content
// files' `@/lib/content/types` import and lib/media's `@/lib/supabase/env`
// import correctly against this repo's tsconfig.
const { projects } = await tsImport('../content/projects.ts', import.meta.url);
const { services } = await tsImport('../content/services.ts', import.meta.url);
const { processImage } = await tsImport('../lib/media/process.ts', import.meta.url);
const { publicUrlFor } = await tsImport('../lib/media/url.ts', import.meta.url);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
// The anon key is checked here too, not because this script authenticates
// with it, but because `publicUrlFor` goes through `supabaseEnv()`, which
// demands both. Failing now beats failing after the first upload.
if (!url || !key || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  throw new Error(
    'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY',
  );
const supabase = createClient(url, key, { auth: { persistSession: false } });

/** Uploads one local file, returns a MediaRef. Caches by local path. */
const uploaded = new Map();
async function uploadLocal(localSrc, alt) {
  if (uploaded.has(localSrc)) return { ...uploaded.get(localSrc), alt };
  const file = path.join('public', localSrc);
  const buffer = await readFile(file);
  const folder = localSrc.split('/')[2]; // /images/<folder>/name
  const processed = await processImage(buffer, path.basename(localSrc), folder);

  const { error: upErr } = await supabase.storage
    .from('media')
    .upload(processed.storagePath, buffer, {
      contentType: processed.mimeType,
      cacheControl: '31536000',
      upsert: false,
    });
  if (upErr && !/already exists/i.test(upErr.message)) throw upErr;

  const publicUrl = publicUrlFor(processed.storagePath);
  const { error: rowErr } = await supabase.from('media').upsert(
    {
      storage_path: processed.storagePath,
      public_url: publicUrl,
      width: processed.width,
      height: processed.height,
      blur_data_url: processed.blurDataURL,
      alt,
      mime_type: processed.mimeType,
      bytes: processed.bytes,
      created_by: 'seed',
    },
    { onConflict: 'storage_path' },
  );
  if (rowErr) throw rowErr;

  const ref = {
    src: publicUrl,
    width: processed.width,
    height: processed.height,
    blurDataURL: processed.blurDataURL,
  };
  uploaded.set(localSrc, ref);
  console.log('media', processed.storagePath);
  return { ...ref, alt };
}

async function upsertEntry(collection, slug, data) {
  const { error } = await supabase
    .from('content_entries')
    .upsert(
      { collection, slug, status: 'published', data, updated_by: 'seed' },
      { onConflict: 'collection,slug' },
    );
  if (error) throw error;
  console.log(collection, slug);
}

for (const project of projects) {
  const images = [];
  for (const image of project.images) {
    images.push({ ...(await uploadLocal(image.src, image.alt)), phase: image.phase });
  }
  await upsertEntry('projects', project.slug, { ...project, images });
}

for (const service of services) {
  const image = service.image ? await uploadLocal(service.image.src, service.image.alt) : undefined;
  await upsertEntry('services', service.slug, { ...service, image });
}

// The two singletons. `lib/site.ts` imports nothing from Next, so tsx can
// load it, and these are the same values the app falls back to with no
// database — seeding them makes the row the source of truth without changing
// what the site says.
const { defaultSiteSettings, defaultContactPage } = await tsImport(
  '../lib/site.ts',
  import.meta.url,
);
await upsertEntry('settings', 'site', defaultSiteSettings);
await upsertEntry('pages', 'contact-us', defaultContactPage);

console.log('Seed complete.');
