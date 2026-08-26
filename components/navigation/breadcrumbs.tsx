import Link from 'next/link';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema } from '@/lib/schema';
import { cn } from '@/lib/utils';

export type Crumb = { name: string; path: string };

/**
 * The two grounds a trail can land on.
 *
 * `ink` is not the light palette with opacity thrown at it: the muted step on
 * white (#6B7075) reads at about 3:1 against #0F1113, which is under the floor
 * for the small text this is set in. The dark trail is tinted from its own
 * ground instead, and its separators are dimmer than its links rather than the
 * other way round.
 */
const tones = {
  paper: {
    trail: 'text-ink-muted',
    separator: 'text-paper-edge',
    current: 'text-ink',
    link: 'hover:text-ink focus-visible:ring-brand-600',
  },
  ink: {
    trail: 'text-white/70',
    separator: 'text-white/30',
    current: 'text-white',
    link: 'hover:text-white focus-visible:ring-white/70',
  },
} as const;

/**
 * Breadcrumbs, with matching BreadcrumbList JSON-LD emitted from the same data
 * so the visible trail and the structured data can never disagree.
 */
export function Breadcrumbs({
  crumbs,
  tone = 'paper',
}: {
  crumbs: readonly Crumb[];
  tone?: keyof typeof tones;
}) {
  const all: Crumb[] = [{ name: 'Home', path: '/' }, ...crumbs];
  const last = all[all.length - 1];
  const t = tones[tone];

  return (
    <>
      <JsonLd data={breadcrumbSchema(all)} />
      <nav aria-label="Breadcrumb" className="py-4">
        <ol className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-sm', t.trail)}>
          {all.map((crumb, index) => {
            const isLast = crumb === last;
            return (
              <li key={crumb.path} className="flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className={t.separator}>
                    /
                  </span>
                )}
                {isLast ? (
                  <span aria-current="page" className={t.current}>
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className={cn(
                      'rounded hover:underline focus-visible:outline-none focus-visible:ring-2',
                      t.link,
                    )}
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
