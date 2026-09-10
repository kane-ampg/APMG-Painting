import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';
import { getAdminPages } from '@/lib/admin/pages';

/**
 * Every public page, with the photograph at the top of it.
 *
 * This is the landing view. An editor picks the page they want to change and
 * then sees it as the sections it is made of.
 */
export default async function AdminPagesList() {
  await requireAdmin();
  const pages = await getAdminPages();

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">Pages</h1>
      <p className="mt-3 max-w-prose text-ink-soft">
        Every page on the site. Open one to change the words and photographs on it.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <li key={page.id}>
            <Link
              href={`/admin/pages/${page.id}/`}
              className="flex h-full flex-col overflow-hidden rounded-lg border border-paper-edge bg-white transition-colors hover:border-brand-600"
            >
              <span className="flex aspect-[16/9] items-center justify-center bg-paper-sunken">
                {page.hero?.src ? (
                  // Plain img: an admin thumbnail, not a public asset.
                  <img src={page.hero.src} alt="" className="h-full w-full object-cover" />
                ) : (
                  // Pages with no photograph of their own get their initial
                  // rather than an empty grey rectangle that reads as broken.
                  <span
                    aria-hidden="true"
                    className="font-display text-4xl font-semibold text-ink-muted"
                  >
                    {page.title.charAt(0)}
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-1 p-4">
                <span className="font-display text-lg tracking-tight text-ink">{page.title}</span>
                <span className="text-xs text-ink-muted">{page.path}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
