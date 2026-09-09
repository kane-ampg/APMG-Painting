'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { processImage } from '@/lib/media/process';
import { toMediaRef, type MediaRow } from '@/lib/media/to-media-ref';
import { publicUrlFor } from '@/lib/media/url';
import { createServerSupabase } from '@/lib/supabase/server';

// Re-exported so existing callers (the media page, the test) can keep
// importing the row type and the pure mapper from the actions module. The
// mapper itself lives in lib/media/to-media-ref.ts because a "use server"
// file's exports must all be async Server Functions.
export type { MediaRow };
export { toMediaRef };

export type MediaActionState = { status: 'idle' | 'ok' | 'error'; message?: string };

const MAX_BYTES = 15 * 1024 * 1024;
const FOLDERS = new Set(['projects', 'work', 'blog', 'hero']);

export async function listMedia(): Promise<MediaRow[]> {
  await requireAdmin();
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
  const file = formData.get('file');
  const folder = String(formData.get('folder') ?? 'work');
  const alt = String(formData.get('alt') ?? '').trim();

  if (!(file instanceof File) || file.size === 0)
    return { status: 'error', message: 'Choose an image.' };
  if (file.size > MAX_BYTES) return { status: 'error', message: 'Images must be under 15 MB.' };
  if (!FOLDERS.has(folder)) return { status: 'error', message: 'Unknown folder.' };
  if (!alt)
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
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('media').update({ alt: alt.trim() }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/media/');
}
