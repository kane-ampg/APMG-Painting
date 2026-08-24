'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isCurrentPage } from '@/lib/nav/active';
import { cn } from '@/lib/utils';

/**
 * The link list inside a footer column.
 *
 * Split out as the footer's only client component so the rest of it stays a
 * Server Component. It exists for one reason: the footer carries every sector
 * page, and it is the list a visitor scrolls to when the header dropdown has
 * already been dismissed. Twelve near-identical links with nothing marking the
 * one you are standing on is where people go in circles.
 *
 * The mark is white text plus an underline, not colour alone — the same rule
 * the header follows (WCAG 1.4.1).
 */
export function FooterNavList({ links }: { links: readonly { label: string; href: string }[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-2.5">
      {links.map((link) => {
        const isCurrent = isCurrentPage(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                isCurrent
                  ? 'text-sm font-semibold text-white underline decoration-brand-400 decoration-2 underline-offset-4'
                  : 'text-sm text-white/85 hover:text-white',
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
