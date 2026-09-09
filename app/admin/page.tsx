import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';
import { collections } from '@/lib/content/schemas';

export default async function AdminHome() {
  const { email } = await requireAdmin();
  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">Signed in as {email}</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {collections.map((c) => (
          <li key={c}>
            <Link
              href={`/admin/${c}/`}
              className="block rounded border border-paper-edge p-4 capitalize"
            >
              {c}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/admin/media/" className="block rounded border border-paper-edge p-4">
            Media library
          </Link>
        </li>
      </ul>
    </>
  );
}
