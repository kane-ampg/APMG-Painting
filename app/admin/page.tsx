import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';
import { collections, isSingleton } from '@/lib/content/schemas';

export default async function AdminHome() {
  const { email } = await requireAdmin();
  return (
    <>
      <h1 className="font-display text-3xl">Signed in as {email}</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {collections
          .filter((c) => !isSingleton(c))
          .map((c) => (
            <li key={c}>
              <Link
                href={`/admin/${c}/`}
                className="block rounded border border-paper-edge p-4 capitalize"
              >
                {c}
              </Link>
            </li>
          ))}
        {/* Straight to the one row each, because a list of one is a wasted
            click and neither can be created or deleted. */}
        <li>
          <Link href="/admin/settings/site/" className="block rounded border border-paper-edge p-4">
            Business details
          </Link>
        </li>
        <li>
          <Link
            href="/admin/pages/contact-us/"
            className="block rounded border border-paper-edge p-4"
          >
            Contact page
          </Link>
        </li>
        <li>
          <Link href="/admin/media/" className="block rounded border border-paper-edge p-4">
            Media library
          </Link>
        </li>
      </ul>
    </>
  );
}
