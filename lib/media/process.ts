import { createHash } from 'node:crypto';
import sharp from 'sharp';

export type ProcessedImage = {
  storagePath: string;
  width: number;
  height: number;
  blurDataURL: string;
  mimeType: string;
  bytes: number;
};

const MIME: Record<string, string> = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  avif: 'image/avif',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * `<folder>/<6 hex of sha256>-<slug>.<ext>`.
 *
 * The hash prefix makes the name a function of the bytes, so the same file
 * uploaded twice lands on the same object (the bucket rejects the second
 * insert, harmlessly) and a changed file always gets a new URL. That is what
 * lets both Supabase and Vercel cache for a year with no busting.
 */
export function objectName(sha256Hex: string, originalName: string, folder: string): string {
  const dot = originalName.lastIndexOf('.');
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  let ext = dot > 0 ? originalName.slice(dot + 1).toLowerCase() : 'bin';
  // A name with a path segment after the last dot (e.g. "x.png/../evil")
  // would otherwise smuggle a "/" into the extension. Anything that isn't
  // plain alphanumerics falls back to a harmless "bin".
  if (!/^[a-z0-9]+$/.test(ext)) ext = 'bin';
  return `${folder}/${sha256Hex.slice(0, 6)}-${slugify(base)}.${ext}`;
}

export async function processImage(
  buffer: Buffer,
  originalName: string,
  folder: string,
): Promise<ProcessedImage> {
  const image = sharp(buffer);
  const meta = await image.metadata();
  const mimeType = meta.format ? MIME[meta.format] : undefined;
  if (!meta.width || !meta.height || !mimeType) {
    throw new Error(`Unsupported image: ${originalName}`);
  }

  const blur = await sharp(buffer).resize(16).webp({ quality: 40 }).toBuffer();
  const sha = createHash('sha256').update(buffer).digest('hex');

  return {
    storagePath: objectName(sha, originalName, folder),
    width: meta.width,
    height: meta.height,
    blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
    mimeType,
    bytes: buffer.byteLength,
  };
}
