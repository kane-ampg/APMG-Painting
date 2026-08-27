import { describe, expect, it } from 'vitest';
import { generateMetadata as projectMetadata } from '@/app/projects/[slug]/page';
import { generateMetadata as suburbMetadata } from '@/app/areas/[state]/[region]/[suburb]/page';
import { projects } from '@/content/projects';
import { site } from '@/lib/site';

/**
 * Metadata that is generated rather than hand-written — project and suburb
 * pages — has to hold the same line the hand-written pages do: branded
 * titles, and descriptions that end at a sentence rather than mid-word.
 *
 * buildMetadata uses `title: { absolute }` on the assumption that every
 * caller-supplied title already ends in the brand. Project pages passed the
 * bare project title, so all four shipped unbranded. The suffix is asserted
 * here rather than trusted.
 */

type OgImage = { url: string | URL; alt?: string };

describe('project page metadata', () => {
  it('brands every project title', async () => {
    for (const project of projects) {
      const meta = await projectMetadata({ params: Promise.resolve({ slug: project.slug }) });
      const title = (meta.title as { absolute: string }).absolute;
      expect(title, project.slug).toMatch(new RegExp(`\\| ${site.name}$`));
    }
  });

  it('ends every description at a sentence or a marked ellipsis', async () => {
    for (const project of projects) {
      const meta = await projectMetadata({ params: Promise.resolve({ slug: project.slug }) });
      expect(meta.description, project.slug).toMatch(/([.!?…])$/);
      expect(meta.description!.length, project.slug).toBeLessThanOrEqual(160);
    }
  });

  it('describes the og:image with the cover photo’s own alt text, not the site name', async () => {
    for (const project of projects.filter((p) => p.images.length > 0)) {
      const meta = await projectMetadata({ params: Promise.resolve({ slug: project.slug }) });
      const images = meta.openGraph?.images as OgImage[];
      expect(images?.[0]?.alt, project.slug).toBe(project.images[0]?.alt);
    }
  });
});

describe('suburb page metadata', () => {
  it('ends a hand-written intro description at a sentence, not mid-word', async () => {
    const meta = await suburbMetadata({
      params: Promise.resolve({ state: 'victoria', region: 'eastern', suburb: 'vermont' }),
    });
    expect(meta.description).toMatch(/([.!?…])$/);
    expect(meta.description!.length).toBeLessThanOrEqual(160);
  });
});
