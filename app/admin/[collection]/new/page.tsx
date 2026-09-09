import { notFound } from 'next/navigation';
import { listMedia } from '@/app/actions/media';
import { EntryForm } from '@/components/admin/entry-form';
import { requireAdmin } from '@/lib/auth/admin';
import { fieldsFor } from '@/lib/content/form-fields';
import { isCollection, type Collection } from '@/lib/content/schemas';
import { defaultContactPage, defaultSiteSettings } from '@/lib/site';

const blank: Record<Collection, Record<string, unknown>> = {
  projects: {
    slug: '',
    title: '',
    clientOrPropertyType: '',
    location: '',
    sectorSlug: '',
    challenge: '',
    scopeOfWork: [],
    images: [],
    outcome: [],
    relatedServiceSlugs: [],
    relatedLocationSlugs: [],
    isFeatured: false,
  },
  services: {
    slug: '',
    title: '',
    shortTitle: '',
    audience: 'commercial',
    summary: '',
    body: [],
    includes: [],
  },
  posts: {
    slug: '',
    title: '',
    excerpt: '',
    body: '',
    publishedAt: new Date().toISOString().slice(0, 10),
    author: 'APMG Painting',
    tags: [],
    metaTitle: '',
    metaDescription: '',
  },
  // Neither is ever reached — the "New" link is hidden for singletons — but
  // the Record<Collection, ...> type demands an entry for every collection.
  settings: defaultSiteSettings as unknown as Record<string, unknown>,
  pages: defaultContactPage as unknown as Record<string, unknown>,
};

type Props = { params: Promise<{ collection: string }> };

export default async function NewEntryPage({ params }: Props) {
  await requireAdmin();
  const { collection } = await params;
  if (!isCollection(collection)) notFound();
  const media = await listMedia();
  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">New {collection.slice(0, -1)}</h1>
      <div className="mt-6">
        <EntryForm
          collection={collection}
          fields={fieldsFor(collection)}
          initial={blank[collection]}
          initialStatus="draft"
          media={media}
        />
      </div>
    </>
  );
}
