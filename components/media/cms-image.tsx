import Image from 'next/image';
import type { MediaRef } from '@/lib/content/types';

type Props = {
  image: MediaRef;
  /** Required. A wrong `sizes` downloads the wrong file and costs LCP. */
  sizes: string;
  /**
   * The LCP image. Kept as `priority` for callers, but next/image's own
   * `priority` prop is deprecated in Next 16 and no longer emits
   * `fetchpriority=high` — so it maps to `preload` plus an explicit
   * `fetchPriority`, which is what actually moves the request up the queue.
   */
  priority?: boolean;
  /** Force fill layout even when dimensions are known (aspect-ratio boxes). */
  fill?: boolean;
  className?: string;
};

/**
 * next/image with the CMS's stored metadata applied.
 *
 * Width, height and blur come from the `media` row written at upload, so the
 * browser reserves the box before the bytes arrive (no CLS) and paints a
 * blur immediately. Seeded legacy `{src, alt}` images have no dimensions
 * and render in fill mode inside their existing aspect-ratio containers.
 */
export function CmsImage({ image, sizes, priority = false, fill = false, className }: Props) {
  const hasBlur = Boolean(image.blurDataURL);
  const useFill = fill || !image.width || !image.height;

  if (useFill) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        preload={priority}
        fetchPriority={priority ? 'high' : undefined}
        placeholder={hasBlur ? 'blur' : 'empty'}
        blurDataURL={image.blurDataURL}
        className={className}
      />
    );
  }

  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      preload={priority}
      fetchPriority={priority ? 'high' : undefined}
      placeholder={hasBlur ? 'blur' : 'empty'}
      blurDataURL={image.blurDataURL}
      className={className}
    />
  );
}
