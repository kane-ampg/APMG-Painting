import { describe, expect, it } from 'vitest';
import { fieldsFor } from '@/lib/content/form-fields';

describe('fieldsFor', () => {
  it('derives editor field kinds from the service schema', () => {
    const byName = Object.fromEntries(fieldsFor('services').map((f) => [f.name, f]));
    expect(byName.slug).toMatchObject({ kind: 'text', required: true });
    expect(byName.summary).toMatchObject({ kind: 'textarea' });
    expect(byName.body).toMatchObject({ kind: 'lines' });
    expect(byName.includes).toMatchObject({ kind: 'lines' });
    expect(byName.image).toMatchObject({ kind: 'image', required: false });
  });

  it('falls back to a JSON field for nested structures', () => {
    const byName = Object.fromEntries(fieldsFor('projects').map((f) => [f.name, f]));
    expect(byName.images).toMatchObject({ kind: 'json' });
    expect(byName.testimonial).toMatchObject({ kind: 'json' });
    expect(byName.isFeatured).toMatchObject({ kind: 'boolean' });
  });

  it('treats ISO date fields as dates', () => {
    const byName = Object.fromEntries(fieldsFor('posts').map((f) => [f.name, f]));
    expect(byName.publishedAt).toMatchObject({ kind: 'date' });
    expect(byName.body).toMatchObject({ kind: 'textarea' });
  });
});
