import { notFound } from 'next/navigation';
import { listMedia } from '@/app/actions/media';
import { EntryForm } from '@/components/admin/entry-form';
import { requireAdmin } from '@/lib/auth/admin';
import { fieldsFor } from '@/lib/content/form-fields';
import { collectionTitles, isCollection, isSingleton, singletonSlug } from '@/lib/content/schemas';
import { getEntryForPreview } from '@/lib/content/source';

type Props = { params: Promise<{ collection: string; slug: string }> };

export default async function EditEntryPage({ params }: Props) {
  await requireAdmin();
  const { collection, slug } = await params;
  if (!isCollection(collection)) notFound();
  const entry = await getEntryForPreview(collection, slug);
  if (!entry) notFound();
  const media = await listMedia();

  // The same names the list page and the dashboard use. A singleton is its
  // own page, so its title stands alone: "Business details", or "Contact
  // page" for the one entry under `pages`. Everything else is one row of a
  // collection and says which.
  const heading = isSingleton(collection)
    ? slug === singletonSlug.pages
      ? 'Contact page'
      : collectionTitles[collection]
    : `${collectionTitles[collection]} / ${slug}`;

  return (
    <>
      <h1 className="font-display text-3xl">{heading}</h1>
      <div className="mt-6">
        <EntryForm
          collection={collection}
          fields={fieldsFor(collection)}
          initial={entry.data as Record<string, unknown>}
          initialStatus={entry.status}
          media={media}
        />
      </div>
    </>
  );
}
