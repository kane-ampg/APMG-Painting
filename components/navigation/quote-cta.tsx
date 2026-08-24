'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export const QUOTE_PATH = '/contact-us/';
export const QUOTE_HASH = '#quote';

/**
 * The header's quote CTA.
 *
 * On any other page it is a normal route change to the contact page, landing
 * directly on the enquiry forms. On the contact page itself a route change
 * would be a no-op, so it renders a plain in-page anchor instead: that keeps
 * the browser's own hash handling, which honours `scroll-behavior: smooth`
 * from globals.css and moves focus to the target. Next's router deliberately
 * forces `scroll-behavior: auto` while it scrolls, so `next/link` cannot
 * produce the same glide.
 */
export function QuoteCta({
  className,
  children,
  onNavigate,
}: {
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const onQuotePage = pathname === QUOTE_PATH || pathname === '/contact-us';

  if (onQuotePage) {
    return (
      <a href={QUOTE_HASH} className={className} onClick={onNavigate}>
        {children}
      </a>
    );
  }

  return (
    <Link href={`${QUOTE_PATH}${QUOTE_HASH}`} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}
