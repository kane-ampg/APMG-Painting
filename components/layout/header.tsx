import Link from 'next/link';
import { DesktopNav } from '@/components/navigation/desktop-nav';
import { MobileMenu } from '@/components/navigation/mobile-menu';
import { Container } from '@/components/ui';
import { site } from '@/lib/site';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-paper-edge bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <Container width="wide">
        <div className="flex h-16 items-center justify-between gap-6 sm:h-20">
          <Link
            href="/"
            className="flex shrink-0 flex-col rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <span className="font-display text-xl font-bold leading-none tracking-tight text-brand-900">
              APMG
            </span>
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Painting
            </span>
          </Link>

          <DesktopNav />

          <div className="flex items-center gap-3">
            <a
              href={site.phone.href}
              className="hidden rounded-md px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:inline-block"
            >
              {site.phone.display}
            </a>
            <Link
              href="/contact-us/"
              className="hidden rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 lg:inline-block"
            >
              Get a quote
            </Link>
            <MobileMenu />
          </div>
        </div>
      </Container>
    </header>
  );
}
