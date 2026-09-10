import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { faqs } from '@/content/faqs';
import { locations } from '@/content/locations';
import { projects } from '@/content/projects';
import { reviews } from '@/content/reviews';
import { sectors } from '@/content/sectors';
import { services } from '@/content/services';
import { accreditations, site } from '@/lib/site';
import type { MediaRow } from './to-media-ref';

/**
 * The media library with no database.
 *
 * Local preview has no `media` table, but it does have the repository's own
 * photographs under `public/images/`. Listing those gives the editor a real
 * grid to look at, and gives Swap image something to swap to, before Supabase
 * exists. Every row is shaped like a `media` row so nothing downstream — the
 * grid, the picker, `toMediaRef` — has to know which mode it is in.
 *
 * Everything under `public/images/` is listed, including the logos in
 * `brand/` and the badges in `accreditations/`. They are not photographs of
 * work, but they are images the site places, and hiding them would make the
 * library disagree with the folder an editor can see on disk.
 */

const IMAGE_EXTENSIONS = new Set(['.webp', '.jpg', '.jpeg', '.png', '.avif', '.gif', '.svg']);

/** Dimensions only sharp can answer for; SVG has none worth reporting. */
async function dimensionsOf(absolutePath: string): Promise<{ width: number; height: number }> {
  try {
    const { default: sharp } = await import('sharp');
    const meta = await sharp(absolutePath).metadata();
    return { width: meta.width ?? 0, height: meta.height ?? 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

/**
 * Alt text the repository already wrote for a given file.
 *
 * The content files are the only place an image's description is authored, so
 * they are the only honest source for one here. An image nothing references
 * gets an empty string rather than an invented sentence.
 */
function altIndex(): Map<string, string> {
  const index = new Map<string, string>();
  const seen = new Set<unknown>();

  const walk = (value: unknown): void => {
    if (value === null || typeof value !== 'object') return;
    if (seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    const record = value as Record<string, unknown>;
    const { src, alt } = record;
    if (typeof src === 'string' && typeof alt === 'string' && !index.has(src)) {
      index.set(src, alt);
    }
    for (const item of Object.values(record)) walk(item);
  };

  walk([projects, services, sectors, locations, reviews, faqs, site, accreditations]);
  return index;
}

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await filesUnder(full)));
    else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

export async function listLocalMedia(): Promise<MediaRow[]> {
  const root = path.join(process.cwd(), 'public', 'images');
  let files: string[];
  try {
    files = await filesUnder(root);
  } catch {
    return [];
  }
  const alts = altIndex();

  const rows = await Promise.all(
    files.sort().map(async (file) => {
      // Site-relative and POSIX-separated: this is a URL, not a path, and the
      // repository is developed on Windows.
      const relative = `/images/${path.relative(root, file).split(path.sep).join('/')}`;
      const [{ width, height }, stats] = await Promise.all([dimensionsOf(file), stat(file)]);
      return {
        // The path is the id. There is no database row to carry one, and it
        // is stable, unique and readable in a URL.
        id: relative,
        storage_path: relative.replace(/^\/images\//, ''),
        public_url: relative,
        width,
        height,
        // No blur is generated here: these files are served straight from
        // `public/`, and a blur is a stored artefact of the upload pipeline.
        blur_data_url: '',
        alt: alts.get(relative) ?? '',
        created_at: stats.mtime.toISOString(),
      } satisfies MediaRow;
    }),
  );

  return rows;
}
