import { supabaseEnv } from '@/lib/supabase/env';

/**
 * The one place a storage path becomes a URL. Switching to Supabase Image
 * Transformations later (spec §4) means changing this function and adding a
 * next/image loader; nothing else moves.
 */
export function publicUrlFor(storagePath: string): string {
  const { url } = supabaseEnv();
  return `${url}/storage/v1/object/public/media/${storagePath}`;
}
