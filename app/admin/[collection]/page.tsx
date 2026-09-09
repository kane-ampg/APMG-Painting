import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { isCollection } from '@/lib/content/schemas';
import { createServerSupabase } from '@/lib/supabase/server';

type Props = { params: Promise<{ collection: string }> };

export default async function CollectionPage({ params }: Props) {
  await requireAdmin();
  const { collection } = await params;
  if (!isCollection(collection)) notFound();

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('content_entries')
    .select('slug, status, updated_at, updated_by')
    .eq('collection', collection)
    .order('updated_at', { ascending: false });

  // Interim check: 'settings' | 'pages' don't exist as collections yet
  // (Task 12 adds them as singletons). Once isSingleton() lands, this
  // becomes !isSingleton(collection). Widened to string because the
  // current Collection union has no overlap with those literals.
  const collectionName: string = collection;
  const canCreate = collectionName !== 'settings' && collectionName !== 'pages';

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl capitalize tracking-tight">{collection}</h1>
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
