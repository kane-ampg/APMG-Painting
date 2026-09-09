import { describe, expect, it } from 'vitest';
import { toMediaRef } from '@/app/actions/media';

describe('toMediaRef', () => {
  it('maps a media row onto the MediaRef the pages consume', () => {
    expect(
      toMediaRef({
        id: 'x',
        storage_path: 'work/abc123-wall.webp',
        public_url: 'https://abc.supabase.co/storage/v1/object/public/media/work/abc123-wall.webp',
        width: 1600,
        height: 900,
        blur_data_url: 'data:image/webp;base64,AAAA',
        alt: 'A wall',
        created_at: '2026-09-08T00:00:00Z',
      }),
    ).toEqual({
      src: 'https://abc.supabase.co/storage/v1/object/public/media/work/abc123-wall.webp',
      alt: 'A wall',
      width: 1600,
      height: 900,
      blurDataURL: 'data:image/webp;base64,AAAA',
    });
  });
});
