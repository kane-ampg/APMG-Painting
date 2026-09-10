import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listMedia } from '@/app/actions/media';
import { EntryForm } from '@/components/admin/entry-form';
import { FIXED_NOTE, getAdminPage, type PageSection } from '@/lib/admin/pages';
import { advancedFields, labelFor } from '@/lib/admin/labels';
import { requireAdmin } from '@/lib/auth/admin';
import { fieldsFor } from '@/lib/content/form-fields';
import type { Collection } from '@/lib/content/schemas';
import { getEntryForPreview, getSiteSettings } from '@/lib/content/source';
import type { MediaRow } from '@/lib/media/to-media-ref';
import { formatAddress } from '@/lib/site';
import type { SiteSettings } from '@/lib/content/types';

type Props = { params: Promise<{ page: string }> };

/** The fields a section names, in the order it names them. */
function specsFor(collection: Collection, names: readonly string[]) {
  const all = fieldsFor(collection);
  return names.flatMap((name) => {
    const spec = all.find((candidate) => candidate.name === name);
    return spec ? [spec] : [];
  });
}

function Card({
  heading,
  detail,
  children,
  muted = false,
}: {
  heading: string;
  detail?: string;
  children?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section
      className={`rounded-lg border border-paper-edge p-5 ${muted ? 'bg-paper-sunken' : 'bg-white'}`}
    >
      <h2 className="font-display text-xl tracking-tight text-ink">{heading}</h2>
      {detail && <p className="mt-1 text-sm text-ink-soft">{detail}</p>}
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
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

async function EntryCard({
  section,
  collection,
  slug,
  media,
  fields,
  heading,
  detail,
  nested = false,
}: {
  section: PageSection;
  collection: Collection;
  slug: string;
  media: MediaRow[];
  fields: readonly string[];
  heading?: string;
  detail?: string;
  nested?: boolean;
}) {
  const entry = await getEntryForPreview(collection, slug);
  const data = (entry?.data ?? {}) as Record<string, unknown>;
  // An entry's own title, never its storage key: the editor recognises
  // "Office painting", not the string in the URL.
  const title = heading ?? String(data.title ?? data.shortTitle ?? '') ?? '';

  if (!entry) {
    return (
      <Card heading={title || 'Not published'} detail="This entry is not published yet." muted />
    );
  }

  const groups = section.kind === 'entry' ? section.groups : undefined;
  const advancedForSection =
    section.kind === 'entry' ? (section.advanced ?? []) : (advancedFields[collection] ?? []);
  const form = (
    <EntryForm
      collection={collection}
      fields={specsFor(collection, fields)}
      initial={data}
      initialStatus={entry.status}
      media={media}
      groups={groups}
      advanced={advancedForSection.filter((name) => fields.includes(name))}
    />
  );

  if (!nested)
    return (
      <Card heading={title} detail={detail}>
        {form}
      </Card>
    );

  return (
    <div className="rounded border border-paper-edge bg-paper p-4">
      <h3 className="font-display text-lg tracking-tight text-ink">{title}</h3>
      {detail && <p className="mt-1 text-sm text-ink-soft">{detail}</p>}
      <div className="mt-4">{form}</div>
    </div>
  );
}

export default async function AdminPageEditor({ params }: Props) {
  await requireAdmin();
  const { page: id } = await params;
  const page = await getAdminPage(id);
  if (!page) notFound();

  const [media, settings] = await Promise.all([listMedia(), getSiteSettings()]);

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
        removed or moved.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {page.sections.map((section) => {
          if (section.kind === 'fixed') {
            return (
              <Card key={section.id} heading={section.heading} detail={section.detail} muted>
                <p className="text-sm text-ink-muted">{FIXED_NOTE}</p>
              </Card>
            );
          }

          if (section.kind === 'settings') {
            return (
              <Card key={section.id} heading={section.heading} detail={section.detail} muted>
                <dl className="flex flex-col gap-2 text-sm">
                  {section.fields.map((field) => (
                    <div key={field} className="flex flex-wrap gap-2">
                      <dt className="font-medium text-ink">{labelFor('settings', field).label}</dt>
                      <dd className="text-ink-soft">{settingValue(settings, field)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm">
                  <Link href="/admin/settings/site/" className="underline">
                    Edit business details
                  </Link>
                </p>
              </Card>
            );
          }

          if (section.kind === 'entry') {
            return (
              <EntryCard
                key={section.id}
                section={section}
                collection={section.collection}
                slug={section.slug}
                media={media}
                fields={section.fields}
                heading={section.heading}
                detail={section.detail}
              />
            );
          }

          if (section.slugs.length === 0) {
            return (
              <Card key={section.id} heading={section.heading} detail={section.detail} muted>
                <p className="text-sm text-ink-muted">Nothing to show here yet.</p>
              </Card>
            );
          }

          return (
            <Card key={section.id} heading={section.heading} detail={section.detail}>
              <div className="flex flex-col gap-8">
                {section.slugs.map((slug) => (
                  <EntryCard
                    key={slug}
                    section={section}
                    collection={section.collection}
                    slug={slug}
                    media={media}
                    fields={section.fields}
                    nested
                  />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
