import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { collectionTitles, isCollection, isSingleton } from '@/lib/content/schemas';
import { listEntriesForAdmin } from '@/lib/content/source';

type Props = { params: Promise<{ collection: string }> };

export default async function CollectionPage({ params }: Props) {
  await requireAdmin();
  const { collection } = await params;
  if (!isCollection(collection)) notFound();

  const data = await listEntriesForAdmin(collection);

  // A singleton has exactly one row at a fixed slug, so there is nothing to
  // create and nothing to delete.
  const canCreate = !isSingleton(collection);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">{collectionTitles[collection]}</h1>
        {canCreate && (
          <Link
            href={`/admin/${collection}/new/`}
            className="rounded bg-brand-600 px-4 py-2 text-white"
          >
            New
          </Link>
        )}
      </div>
      <table className="mt-6 w-full text-sm">
        <thead className="text-left text-ink-soft">
          <tr>
            <th className="py-2">Slug</th>
            <th>Status</th>
            <th>Updated</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => (
            <tr key={row.slug} className="border-t border-paper-edge">
              <td className="py-2">
                <Link href={`/admin/${collection}/${row.slug}/`} className="underline">
                  {row.slug}
                </Link>
              </td>
              <td>{row.status}</td>
              <td>{new Date(row.updated_at).toLocaleString('en-AU')}</td>
              <td>{row.updated_by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
