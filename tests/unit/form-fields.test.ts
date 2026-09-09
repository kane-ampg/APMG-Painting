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

  it('renders the settings singleton as text, textarea and JSON fields', () => {
    const byName = Object.fromEntries(fieldsFor('settings').map((f) => [f.name, f]));
    expect(byName.phone).toMatchObject({ kind: 'text', required: true });
    expect(byName.serviceAreaPrimary).toMatchObject({ kind: 'text', required: true });
    // Nullable strings stay single-line inputs rather than falling through to
    // a JSON textarea, and are not marked required — null is a valid answer.
    expect(byName.abn).toMatchObject({ kind: 'text', required: false, nullable: true });
    // Nested shapes are validated JSON, per spec section 6.
    expect(byName.address).toMatchObject({ kind: 'json' });
    expect(byName.coords).toMatchObject({ kind: 'json', nullable: true });
    expect(byName.openingHours).toMatchObject({ kind: 'json', nullable: true });
    expect(byName.social).toMatchObject({ kind: 'json' });
    expect(byName.slug).toBeUndefined();
  });

  it('gives the contact page copy its long-form fields as textareas', () => {
    const byName = Object.fromEntries(fieldsFor('pages').map((f) => [f.name, f]));
    expect(byName.lede).toMatchObject({ kind: 'textarea' });
    expect(byName.formIntro).toMatchObject({ kind: 'textarea' });
    expect(byName.metaDescription).toMatchObject({ kind: 'textarea' });
    expect(byName.title).toMatchObject({ kind: 'text' });
    // A singleton's slug is fixed and set by the save action, so it is not
    // offered as an editable field even where the schema declares one.
    expect(byName.slug).toBeUndefined();
    expect(fieldsFor('pages').some((f) => f.name === 'slug')).toBe(false);
  });
});
