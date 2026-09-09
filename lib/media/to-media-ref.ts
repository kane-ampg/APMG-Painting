import type { MediaRef } from '@/lib/content/types';

export type MediaRow = {
  id: string;
  storage_path: string;
  public_url: string;
  width: number;
  height: number;
  blur_data_url: string;
  alt: string;
  created_at: string;
};

/**
 * Pure mapping, kept out of `app/actions/media.ts`.
 *
 * A `"use server"` file may only export async Server Functions (the Next.js
 * 16 build enforces this), so this plain sync mapper lives here and is
 * re-exported for callers that still import it from the actions module.
 */
export function toMediaRef(row: MediaRow): MediaRef {
  return {
    src: row.public_url,
    alt: row.alt,
    width: row.width,
    height: row.height,
    blurDataURL: row.blur_data_url,
  };
}
