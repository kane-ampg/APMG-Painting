import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntryForm, cleanField } from '@/components/admin/entry-form';
import { fieldsFor, type FieldSpec } from '@/lib/content/form-fields';

// A Server Action cannot execute in jsdom, and these tests are about the
// form's own state handling, not the save round trip.
const saveSpy = vi.fn();
vi.mock('@/app/actions/content', () => ({
  saveEntry: (previous: unknown, formData: FormData) => saveSpy(previous, formData),
}));

const serviceFields = fieldsFor('services');
const projectFields = fieldsFor('projects');

function specs(all: FieldSpec[], names: string[]): FieldSpec[] {
  return names.flatMap((name) => all.filter((field) => field.name === name));
}

/** Narrows an index lookup that the test's own setup guarantees. */
function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`missing ${what}`);
  return value;
}

function hiddenDataValue(container: HTMLElement): Record<string, unknown> {
  const input = container.querySelector('input[name="data"]') as HTMLInputElement;
  return JSON.parse(input.value) as Record<string, unknown>;
}

describe('EntryForm list fields', () => {
  afterEach(() => saveSpy.mockReset());

  it('adds and removes items and reflects them in the submitted data', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <EntryForm
        collection="services"
        fields={specs(serviceFields, ['includes'])}
        initial={{ slug: 'interior-painting', includes: ['Walls'] }}
        initialStatus="draft"
        media={[]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /add item/i }));
    await user.type(screen.getByLabelText(/what it includes, item 2/i), 'Ceilings');

    expect(hiddenDataValue(container)).toMatchObject({ includes: ['Walls', 'Ceilings'] });

    await user.click(must(screen.getAllByRole('button', { name: /remove/i })[0], 'remove button'));
    expect(hiddenDataValue(container)).toMatchObject({ includes: ['Ceilings'] });
  });
});

describe('EntryForm labelling', () => {
  afterEach(() => saveSpy.mockReset());

  it('names fields in English and keeps technical ones in the Advanced group', () => {
    render(
      <EntryForm
        collection="services"
        fields={serviceFields}
        initial={{
          slug: 'interior-painting',
          title: 'Interior painting',
          shortTitle: 'Interior',
          audience: 'commercial',
          summary: 'Summary',
          body: [],
          includes: [],
        }}
        initialStatus="published"
        advanced={['slug', 'audience']}
        media={[]}
      />,
    );

    expect(screen.getByLabelText(/service title/i)).toBeInTheDocument();
    expect(screen.getByText(/what it includes/i)).toBeInTheDocument();
    const advanced = screen.getByText('Advanced').closest('details') as HTMLDetailsElement;
    expect(advanced).toBeInTheDocument();
    // The only place a storage name may surface is inside that group.
    expect(advanced.contains(screen.getByLabelText(/web address/i))).toBe(true);
  });

  it('keeps every entry field in the payload when only some are shown', () => {
    const { container } = render(
      <EntryForm
        collection="services"
        fields={specs(serviceFields, ['title'])}
        initial={{
          slug: 'interior-painting',
          title: 'Interior painting',
          shortTitle: 'Interior',
          audience: 'commercial',
          summary: 'Summary',
          body: ['One'],
          includes: ['Walls'],
        }}
        initialStatus="published"
        media={[]}
      />,
    );

    expect(hiddenDataValue(container)).toMatchObject({
      slug: 'interior-painting',
      shortTitle: 'Interior',
      body: ['One'],
      includes: ['Walls'],
    });
  });
});

describe('cleanField', () => {
  const byName = Object.fromEntries(projectFields.map((field) => [field.name, field]));
  const field = (name: string) => must(byName[name], name);

  it('drops blank list items', () => {
    expect(cleanField(field('scopeOfWork'), ['Walls', '  ', ''], undefined)).toEqual(['Walls']);
  });

  it('keeps an editorial placeholder the editor did not replace', () => {
    const placeholder = { __placeholder: true, note: 'Awaiting confirmation' };
    expect(cleanField(field('duration'), '', placeholder)).toEqual(placeholder);
    expect(cleanField(field('duration'), 'Six weeks', placeholder)).toBe('Six weeks');
  });

  it('drops a testimonial with nothing in it', () => {
    expect(
      cleanField(field('testimonial'), { quote: '', attribution: '' }, undefined),
    ).toBeUndefined();
    expect(
      cleanField(
        field('testimonial'),
        { quote: 'Great', attribution: 'A client', role: '' },
        undefined,
      ),
    ).toEqual({ quote: 'Great', attribution: 'A client' });
  });

  it('drops gallery rows with no picture', () => {
    expect(
      cleanField(
        field('images'),
        [
          { src: '/a.webp', alt: 'A' },
          { src: '', alt: '' },
        ],
        undefined,
      ),
    ).toEqual([{ src: '/a.webp', alt: 'A' }]);
  });

  it('sends null rather than an empty string for a nullable field', () => {
    const settings = fieldsFor('settings');
    const abn = must(
      settings.find((spec) => spec.name === 'abn'),
      'abn',
    );
    expect(cleanField(abn, '', undefined)).toBeNull();
  });
});

describe('Swap image', () => {
  afterEach(() => saveSpy.mockReset());

  const library = [
    {
      id: '/images/work/office-roller-occupied.webp',
      storage_path: 'work/office-roller-occupied.webp',
      public_url: '/images/work/office-roller-occupied.webp',
      width: 1600,
      height: 900,
      blur_data_url: '',
      alt: 'A painter rolling an office wall',
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '/images/hero/about-hero.webp',
      storage_path: 'hero/about-hero.webp',
      public_url: '/images/hero/about-hero.webp',
      width: 1920,
      height: 1080,
      blur_data_url: '',
      alt: 'The crew on site',
      created_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('opens the library, shows dimensions, and sets the field from the chosen image', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <EntryForm
        collection="services"
        fields={specs(serviceFields, ['image'])}
        initial={{
          slug: 'office-painting',
          image: { src: '/images/hero/about-hero.webp', alt: 'Old' },
        }}
        initialStatus="published"
        media={library}
      />,
    );

    await user.click(screen.getByRole('button', { name: /swap image/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('1600 × 900')).toBeInTheDocument();

    await user.click(screen.getByText('office-roller-occupied.webp'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(hiddenDataValue(container).image).toMatchObject({
      src: '/images/work/office-roller-occupied.webp',
      // The description already written for this placement survives the swap.
      alt: 'Old',
    });
  });

  it('filters the library by file name and by description', async () => {
    const user = userEvent.setup();
    render(
      <EntryForm
        collection="services"
        fields={specs(serviceFields, ['image'])}
        initial={{ slug: 'office-painting' }}
        initialStatus="draft"
        media={library}
      />,
    );

    await user.click(screen.getByRole('button', { name: /choose an image/i }));
    await user.type(screen.getByLabelText(/search/i), 'crew');

    expect(screen.getByText('about-hero.webp')).toBeInTheDocument();
    expect(screen.queryByText('office-roller-occupied.webp')).not.toBeInTheDocument();
  });
});
