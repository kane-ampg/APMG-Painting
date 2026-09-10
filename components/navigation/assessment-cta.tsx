'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export const ASSESSMENT_PATH = '/contact-us/';
export const ASSESSMENT_HASH = '#assessment';

/**
 * The header's site assessment CTA.
 *
 * On any other page it is a normal route change to the contact page, landing
 * directly on the booking form. On the contact page itself a route change
 * would be a no-op, so it renders a plain in-page anchor instead: that keeps
 * the browser's own hash handling, which honours `scroll-behavior: smooth`
 * from globals.css and moves focus to the target. Next's router deliberately
 * forces `scroll-behavior: auto` while it scrolls, so `next/link` cannot
 * produce the same glide.
 */
export function AssessmentCta({
  className,
  children,
  onNavigate,
}: {
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const onContactPage = pathname === ASSESSMENT_PATH || pathname === '/contact-us';

  if (onContactPage) {
    return (
      <a href={ASSESSMENT_HASH} className={className} onClick={onNavigate}>
        {children}
      </a>
    );
  }

  return (
    <Link href={`${ASSESSMENT_PATH}${ASSESSMENT_HASH}`} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}
