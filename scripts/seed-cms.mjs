/**
 * One-off seed: pushes the TypeScript content and public/images into
 * Supabase. Idempotent — re-running upserts entries and skips objects that
 * already exist. Needs SUPABASE_SERVICE_ROLE_KEY; this is the only place it
 * is ever used.
 *
 * Run: node --env-file=.env.local scripts/seed-cms.mjs
 */
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Load the TS content through tsx so the arrays are the single source.
register('tsx/esm', pathToFileURL('./'));
const { projects } = await import('../content/projects.ts');
const { services } = await import('../content/services.ts');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(url, key, { auth: { persistSession: false } });

const MIME = { webp: 'image/webp', jpeg: 'image/jpeg', png: 'image/png', avif: 'image/avif' };
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Uploads one local file, returns a MediaRef. Caches by local path. */
const uploaded = new Map();
async function uploadLocal(localSrc, alt) {
  if (uploaded.has(localSrc)) return { ...uploaded.get(localSrc), alt };
  const file = path.join('public', localSrc);
  const buffer = await readFile(file);
  const meta = await sharp(buffer).metadata();
  const sha = createHash('sha256').update(buffer).digest('hex');
  const folder = localSrc.split('/')[2]; // /images/<folder>/name
  const base = path.basename(localSrc, path.extname(localSrc));
  const ext = path.extname(localSrc).slice(1).toLowerCase();
  const storagePath = `${folder}/${sha.slice(0, 6)}-${slugify(base)}.${ext}`;
  const blur = await sharp(buffer).resize(16).webp({ quality: 40 }).toBuffer();

  const { error: upErr } = await supabase.storage.from('media').upload(storagePath, buffer, {
    contentType: MIME[meta.format],
    cacheControl: '31536000',
    upsert: false,
  });
  if (upErr && !/already exists/i.test(upErr.message)) throw upErr;

  const publicUrl = `${url}/storage/v1/object/public/media/${storagePath}`;
  const { error: rowErr } = await supabase.from('media').upsert(
    {
      storage_path: storagePath,
      public_url: publicUrl,
      width: meta.width,
      height: meta.height,
      blur_data_url: `data:image/webp;base64,${blur.toString('base64')}`,
      alt,
      mime_type: MIME[meta.format],
      bytes: buffer.byteLength,
      created_by: 'seed',
    },
    { onConflict: 'storage_path' },
  );
  if (rowErr) throw rowErr;

  const ref = {
    src: publicUrl,
    width: meta.width,
    height: meta.height,
    blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
  };
  uploaded.set(localSrc, ref);
  console.log('media', storagePath);
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

console.log('Seed complete.');
