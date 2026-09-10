'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { processImage } from '@/lib/media/process';
import type { MediaRow } from '@/lib/media/to-media-ref';
import { publicUrlFor } from '@/lib/media/url';
import { LOCAL_PREVIEW_MESSAGE, isLocalPreview } from '@/lib/supabase/env';
import { createServerSupabase } from '@/lib/supabase/server';

// The pure MediaRow -> MediaRef mapper lives in lib/media/to-media-ref.ts —
// import it from there, never from this file. Next's
// next-flight-server-reference-proxy-loader rewrites every export of a
// "use server" module into a createServerReference(...) network-RPC proxy
// when the module is referenced from a client bundle, so a client component
// importing toMediaRef from here would get a Promise-returning proxy instead
// of the mapper. Only the type is safe to re-export (types are erased before
// that transform runs).
export type { MediaRow };

export type MediaActionState = { status: 'idle' | 'ok' | 'error'; message?: string };

const MAX_BYTES = 15 * 1024 * 1024;
const FOLDERS = new Set(['projects', 'work', 'blog', 'hero']);

export async function listMedia(): Promise<MediaRow[]> {
  await requireAdmin();
  if (isLocalPreview()) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('media')
    .select('id, storage_path, public_url, width, height, blur_data_url, alt, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MediaRow[];
}

export async function uploadMedia(
  _prev: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const { email } = await requireAdmin();
  if (isLocalPreview()) return { status: 'error', message: LOCAL_PREVIEW_MESSAGE };
  const file = formData.get('file');
  const folder = String(formData.get('folder') ?? 'work');
  const alt = String(formData.get('alt') ?? '').trim();
  const describeLater = formData.get('describeLater') === 'on';

  if (!(file instanceof File) || file.size === 0)
    return { status: 'error', message: 'Choose an image.' };
  if (file.size > MAX_BYTES) return { status: 'error', message: 'Images must be under 15 MB.' };
  if (!FOLDERS.has(folder)) return { status: 'error', message: 'Unknown folder.' };
  // Alt text is required up front unless the editor opted to describe the
  // image with AI after it is uploaded — "Describe with AI" needs a public
  // URL, which does not exist until the upload completes.
  if (!alt && !describeLater)
    return { status: 'error', message: 'Alt text is required. Use "Describe with AI" if stuck.' };

  // Read the upload once: the buffer is reused for both processing and storage.
  const buffer = Buffer.from(await file.arrayBuffer());

  let processed;
  try {
    processed = await processImage(buffer, file.name, folder);
  } catch {
    return {
      status: 'error',
      message: 'That file is not a supported image (webp, jpeg, png, avif).',
    };
  }

  const supabase = await createServerSupabase();
  const { error: upErr } = await supabase.storage
    .from('media')
    .upload(processed.storagePath, buffer, {
      contentType: processed.mimeType,
      cacheControl: '31536000',
      upsert: false,
    });
  // "already exists" means identical bytes were uploaded before: fine, reuse.
  if (upErr && !/already exists/i.test(upErr.message)) {
    return { status: 'error', message: `Upload failed: ${upErr.message}` };
  }

  const { error: rowErr } = await supabase.from('media').upsert(
    {
      storage_path: processed.storagePath,
      public_url: publicUrlFor(processed.storagePath),
      width: processed.width,
      height: processed.height,
      blur_data_url: processed.blurDataURL,
      alt,
      mime_type: processed.mimeType,
      bytes: processed.bytes,
      created_by: email,
    },
    { onConflict: 'storage_path' },
  );
  if (rowErr)
    return { status: 'error', message: `Saved the file but not its record: ${rowErr.message}` };

  revalidatePath('/admin/media/');
  return {
    status: 'ok',
    message: `Uploaded ${processed.storagePath} (${processed.width}×${processed.height}).`,
  };
}

export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  await requireAdmin();
  if (isLocalPreview()) throw new Error(LOCAL_PREVIEW_MESSAGE);
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('media').update({ alt: alt.trim() }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/media/');
}
