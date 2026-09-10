import { describe, expect, it } from 'vitest';
import { fieldsFor, type FieldSpec } from '@/lib/content/form-fields';

function byName(collection: Parameters<typeof fieldsFor>[0]): Record<string, FieldSpec> {
  return Object.fromEntries(fieldsFor(collection).map((field) => [field.name, field]));
}

/** Narrows an index lookup the assertion above has already proved. */
function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`missing ${what}`);
  return value;
}

describe('fieldsFor', () => {
  it('derives editor field kinds from the service schema', () => {
    const fields = byName('services');
    expect(fields.slug).toMatchObject({ kind: 'text', required: true });
    expect(fields.summary).toMatchObject({ kind: 'textarea' });
    expect(fields.body).toMatchObject({ kind: 'lines' });
    expect(fields.includes).toMatchObject({ kind: 'lines' });
    expect(fields.image).toMatchObject({ kind: 'image', required: false });
  });

  it('gives every nested shape a control of its own, so no field falls back to raw data', () => {
    const fields = byName('projects');
    expect(fields.images).toMatchObject({ kind: 'gallery' });
    // A union of a testimonial and an editorial placeholder is still a
    // testimonial to the editor; the placeholder is carried, not shown as data.
    expect(fields.testimonial).toMatchObject({ kind: 'testimonial', allowsPlaceholder: true });
    expect(fields.duration).toMatchObject({ kind: 'text', allowsPlaceholder: true });
    expect(fields.isFeatured).toMatchObject({ kind: 'boolean' });
    expect(fields.scopeOfWork).toMatchObject({ kind: 'lines' });
  });

  it('treats ISO date fields as dates and carries the schema length limits', () => {
    const fields = byName('posts');
    expect(fields.publishedAt).toMatchObject({ kind: 'date' });
    expect(fields.body).toMatchObject({ kind: 'textarea' });
    expect(fields.cover).toMatchObject({ kind: 'image' });
    expect(fields.metaTitle).toMatchObject({ kind: 'text', maxLength: 70 });
    expect(fields.metaDescription).toMatchObject({ kind: 'textarea', maxLength: 160 });
  });

  it('renders the settings singleton as labelled groups rather than raw data', () => {
    const fields = byName('settings');
    expect(fields.phone).toMatchObject({ kind: 'text', required: true });
    expect(fields.serviceAreaPrimary).toMatchObject({ kind: 'text', required: true });
    // Nullable strings stay single-line inputs and are not marked required —
    // null is a valid answer.
    expect(fields.abn).toMatchObject({ kind: 'text', required: false, nullable: true });
    expect(fields.previousAddress).toMatchObject({ kind: 'text', nullable: true });

    expect(fields.address).toMatchObject({ kind: 'group' });
    const address = Object.fromEntries(
      (must(fields.address, 'address').children ?? []).map((child) => [child.name, child]),
    );
    expect(address.street).toMatchObject({ kind: 'text' });
    expect(must(address.state, 'state')).toMatchObject({ kind: 'select' });
    expect(must(address.state, 'state').options).toContain('VIC');
    expect(address.effectiveFrom).toMatchObject({ kind: 'date', nullable: true });

    expect(fields.coords).toMatchObject({ kind: 'group', nullable: true });
    expect((must(fields.coords, 'coords').children ?? []).map((child) => child.kind)).toEqual([
      'number',
      'number',
    ]);

    expect(fields.openingHours).toMatchObject({ kind: 'group-list', nullable: true });
    const hours = Object.fromEntries(
      (must(fields.openingHours, 'opening hours').children ?? []).map((child) => [
        child.name,
        child.kind,
      ]),
    );
    expect(hours).toEqual({ days: 'lines', opens: 'text', closes: 'text' });

    expect(fields.social).toMatchObject({ kind: 'group' });
    expect(fields.slug).toBeUndefined();
  });

  it('gives the contact page copy its long-form fields as textareas', () => {
    const fields = byName('pages');
    expect(fields.lede).toMatchObject({ kind: 'textarea' });
    expect(fields.formIntro).toMatchObject({ kind: 'textarea' });
    expect(fields.metaDescription).toMatchObject({ kind: 'textarea' });
    expect(fields.title).toMatchObject({ kind: 'text' });
    // A singleton's slug is fixed and set by the save action, so it is not
    // offered as an editable field even where the schema declares one.
    expect(fields.slug).toBeUndefined();
  });

  it('never produces a raw-data field for any collection', () => {
    const kinds = new Set<string>();
    const walk = (fields: FieldSpec[]) => {
      for (const field of fields) {
        kinds.add(field.kind);
        if (field.children) walk(field.children);
      }
    };
    for (const collection of ['projects', 'services', 'posts', 'settings', 'pages'] as const) {
      walk(fieldsFor(collection));
    }
    expect([...kinds].sort()).toEqual([
      'boolean',
      'date',
      'gallery',
      'group',
      'group-list',
      'image',
      'lines',
      'number',
      'select',
      'testimonial',
      'text',
      'textarea',
    ]);
  });
});
