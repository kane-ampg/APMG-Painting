import { describe, expect, it } from 'vitest';
import { collectionSchemas, postSchema, projectSchema, serviceSchema } from '@/lib/content/schemas';
import { projects } from '@/content/projects';
import { services } from '@/content/services';

describe('content schemas', () => {
  it('accept every seeded project', () => {
    for (const project of projects) {
      const result = projectSchema.safeParse(project);
      expect(result.success, `project ${project.slug}: ${JSON.stringify(result)}`).toBe(true);
    }
  });

  it('accept every seeded service', () => {
    for (const service of services) {
      expect(serviceSchema.safeParse(service).success, service.slug).toBe(true);
    }
  });

  it('reject a project whose slug has capitals', () => {
    const bad = { ...projects[0], slug: 'Bad-Slug' };
    expect(projectSchema.safeParse(bad).success).toBe(false);
  });

  it('require a published post to carry a meta description under 160 chars', () => {
    const base = {
      slug: 'first-post',
      title: 'First post',
      excerpt: 'Short.',
      body: '# Hello',
      publishedAt: '2026-09-08',
      author: 'APMG Painting',
      tags: [],
      metaTitle: 'First post | APMG Painting',
      metaDescription: 'x'.repeat(161),
    };
    expect(postSchema.safeParse(base).success).toBe(false);
    expect(postSchema.safeParse({ ...base, metaDescription: 'Fine.' }).success).toBe(true);
  });

  it('exposes a schema for each content collection', () => {
    // Task 12 adds 'settings' and 'pages'; this stays true afterwards.
    expect(Object.keys(collectionSchemas)).toEqual(
      expect.arrayContaining(['posts', 'projects', 'services']),
    );
  });
});
