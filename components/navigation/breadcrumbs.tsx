import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/schema';

export type Crumb = { name: string; path: string };

/**
 * Breadcrumbs, with matching BreadcrumbList JSON-LD emitted from the same data
 * so the visible trail and the structured data can never disagree.
 */
export function Breadcrumbs({ crumbs }: { crumbs: readonly Crumb[] }) {
  const all: Crumb[] = [{ name: 'Home', path: '/' }, ...crumbs];
  const last = all[all.length - 1];

  return (
    <>
      <JsonLd data={breadcrumbSchema(all)} />
      <nav aria-label="Breadcrumb" className="py-4">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
          {all.map((crumb, index) => {
            const isLast = crumb === last;
            return (
              <li key={crumb.path} className="flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className="text-paper-edge">
                    /
                  </span>
                )}
                {isLast ? (
                  <span aria-current="page" className="text-ink">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="rounded hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
