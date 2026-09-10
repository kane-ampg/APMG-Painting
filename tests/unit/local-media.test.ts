import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { projects } from '@/content/projects';
import { services } from '@/content/services';
import { listLocalMedia } from '@/lib/media/local-library';
import { toMediaRef } from '@/lib/media/to-media-ref';

const imagesRoot = path.join(process.cwd(), 'public', 'images');

/** Narrows a lookup the repository's own content guarantees. */
function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`missing ${what}`);
  return value;
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}

describe('the local media library', () => {
  it('lists every image in the repository, whatever folder it sits in', async () => {
    const rows = await listLocalMedia();
    const onDisk = filesUnder(imagesRoot).length;
    expect(rows).toHaveLength(onDisk);
    // Logos and accreditation badges are images the site places, so they are
    // in the library rather than filtered out of it.
    expect(rows.map((row) => row.public_url)).toContain('/images/brand/apmg-logo-ink.webp');
    expect(rows.map((row) => row.public_url)).toContain('/images/work/office-roller-occupied.webp');
  });

  it('serves each file from its own site-relative path and identifies it by that path', async () => {
    const rows = await listLocalMedia();
    for (const row of rows) {
      expect(row.public_url.startsWith('/images/')).toBe(true);
      expect(row.id).toBe(row.public_url);
      // Windows separators would 404 in the browser.
      expect(row.public_url).not.toContain('\\');
    }
  });

  it('reads real dimensions', async () => {
    const rows = await listLocalMedia();
    const hero = rows.find((row) => row.public_url === '/images/hero/banner-poster.webp');
    expect(hero).toBeDefined();
    expect(hero?.width).toBeGreaterThan(0);
    expect(hero?.height).toBeGreaterThan(0);
  });

  it('takes alt text from the content that already places the image, and invents none', async () => {
    const rows = await listLocalMedia();
    const byUrl = Object.fromEntries(rows.map((row) => [row.public_url, row]));

    const office = must(
      services.find((service) => service.slug === 'office-painting'),
      'the office service',
    );
    const card = must(office.image, 'the office service photograph');
    expect(must(byUrl[card.src], card.src).alt).toBe(card.alt);

    const cover = must(must(projects[0], 'the first project').images[0], 'its cover');
    expect(must(byUrl[cover.src], cover.src).alt).toBe(cover.alt);

    // Nothing in content/ or lib/site.ts places the logo, so it has no
    // description rather than a made-up one.
    const logo = '/images/brand/apmg-logo-white.webp';
    expect(must(byUrl[logo], logo).alt).toBe('');
  });

  it('produces rows a media reference can be built from', async () => {
    const rows = await listLocalMedia();
    const first = must(rows[0], 'the first image');
    const ref = toMediaRef(first);
    expect(ref.src).toBe(first.public_url);
    // No blur is stored for a file served straight out of public/.
    expect(ref.blurDataURL).toBe('');
  });
});
