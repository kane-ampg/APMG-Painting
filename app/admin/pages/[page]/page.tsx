import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listMedia } from '@/app/actions/media';
import {
  PageEditor,
  type EditableEntry,
  type SectionModel,
} from '@/components/admin/page-editor';
import { advancedFields, labelFor } from '@/lib/admin/labels';
import { FIXED_NOTE, getAdminPage, sectorOptions, type PageSection } from '@/lib/admin/pages';
import { requireAdmin } from '@/lib/auth/admin';
import { fieldsFor, type FieldSpec } from '@/lib/content/form-fields';
import type { Collection } from '@/lib/content/schemas';
import { getEntryForPreview, getSiteSettings } from '@/lib/content/source';
import type { SiteSettings } from '@/lib/content/types';
import { formatAddress } from '@/lib/site';

type Props = { params: Promise<{ page: string }> };

/**
 * The fields a section names, in the order it names them, with the editor's
 * presentation applied: a sector picks from the sectors that exist, and a
 * card section shows only the cover photograph, because the cover is the only
 * photograph that section puts on screen.
 */
function specsFor(
  collection: Collection,
  names: readonly string[],
  cardOnly: boolean,
): FieldSpec[] {
  const all = fieldsFor(collection);
  return names.flatMap((name) => {
    const spec = all.find((candidate) => candidate.name === name);
    if (!spec) return [];
    if (collection === 'projects' && name === 'sectorSlug') {
      const options = sectorOptions();
      return [
        {
          ...spec,
          kind: 'select' as const,
          options: options.map((option) => option.value),
          optionLabels: Object.fromEntries(
            options.map((option) => [option.value, option.label]),
          ),
        },
      ];
    }
    if (cardOnly && spec.kind === 'gallery') return [{ ...spec, coverOnly: true }];
    return [spec];
  });
}

/** Plain-English rendering of one business detail. */
function settingValue(settings: SiteSettings, field: string): string {
  switch (field) {
    case 'address':
      return formatAddress(settings.address);
    case 'openingHours':
      return settings.openingHours?.length
        ? settings.openingHours
            .map((hours) => `${hours.days.join(', ')} ${hours.opens}–${hours.closes}`)
            .join('; ')
        : 'Not published';
    case 'abn':
      return settings.abn ?? 'Not published';
    case 'phone':
      return settings.phone;
    case 'email':
      return settings.email;
    default:
      return '';
  }
}

async function entryFor(
  section: Extract<PageSection, { kind: 'entries' | 'entry' }>,
  slug: string,
): Promise<EditableEntry | null> {
  const entry = await getEntryForPreview(section.collection, slug);
  if (!entry) return null;
  const data = entry.data as Record<string, unknown>;
  const advanced =
    section.kind === 'entry'
      ? (section.advanced ?? [])
      : (advancedFields[section.collection] ?? []);
  return {
    key: `${section.id}:${slug}`,
    // An entry's own title, never its storage key: the editor recognises
    // "Office painting", not the string in the URL.
    title: String(data.title ?? data.shortTitle ?? slug),
    collection: section.collection,
    slug,
    status: entry.status,
    data,
    fields: specsFor(section.collection, section.fields, section.kind === 'entries'),
    groups: section.kind === 'entry' ? section.groups : undefined,
    advanced: advanced.filter((name) => section.fields.includes(name)),
  };
}

export default async function AdminPageEditor({ params }: Props) {
  await requireAdmin();
  const { page: id } = await params;
  const page = await getAdminPage(id);
  if (!page) notFound();

  const [media, settings] = await Promise.all([listMedia(), getSiteSettings()]);

  const sections: SectionModel[] = await Promise.all(
    page.sections.map(async (section): Promise<SectionModel> => {
      if (section.kind === 'fixed') {
        return { kind: 'fixed', id: section.id, heading: section.heading, detail: section.detail };
      }
      if (section.kind === 'settings') {
        return {
          kind: 'settings',
          id: section.id,
          heading: section.heading,
          detail: section.detail,
          values: section.fields.map((field) => ({
            label: labelFor('settings', field).label,
            value: settingValue(settings, field),
          })),
        };
      }
      const slugs = section.kind === 'entry' ? [section.slug] : section.slugs;
      const resolved = await Promise.all(slugs.map((slug) => entryFor(section, slug)));
      const missing = slugs.filter((_, index) => resolved[index] === null);
      return {
        kind: 'entries',
        id: section.id,
        heading: section.heading,
        detail: section.detail,
        entries: resolved.filter((entry): entry is EditableEntry => entry !== null),
        empty:
          missing.length > 0
            ? missing.map((slug) => `Entry not found: ${slug}`).join(' ')
            : undefined,
      };
    }),
  );

  return (
    <>
      <nav className="text-sm text-ink-soft">
        <Link href="/admin/pages/" className="underline">
          Pages
        </Link>
      </nav>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{page.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{page.path}</p>
        </div>
        <a href={page.path} target="_blank" rel="noreferrer" className="text-sm underline">
          View this page
        </a>
      </div>
      <p className="mt-4 max-w-prose text-ink-soft">
        The sections below are in the order they appear on the page. Sections can not be added,
        removed or moved, and photographs are swapped rather than added.
      </p>

      <div className="mt-8">
        <PageEditor
          pagePath={page.path}
          sections={sections}
          media={media}
          fixedNote={FIXED_NOTE}
        />
      </div>
    </>
  );
}
