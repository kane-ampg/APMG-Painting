import Image from 'next/image';
import Link from 'next/link';
import { DesktopNav } from '@/components/navigation/desktop-nav';
import { MobileMenu } from '@/components/navigation/mobile-menu';
import { QuoteCta } from '@/components/navigation/quote-cta';
import { Container } from '@/components/ui';
import { site } from '@/lib/site';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-paper-edge bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <Container width="wide">
        {/* h-16/sm:h-20 plus this header's 1px rule is what `.hero-viewport`
            subtracts to size the homepage fold. Change one, change both. */}
        <div className="flex h-16 items-center justify-between gap-6 sm:h-20">
          {/* The real mark, not a typeset stand-in. The source file is a
              single-colour mark on transparency, so `-ink` is the same artwork
              recoloured for light grounds; the footer uses the white original. */}
          <Link
            href="/"
            aria-label="APMG Painting — home"
            className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <Image
              src="/images/brand/apmg-logo-ink.webp"
              alt="APMG Painting"
              width={378}
              height={285}
              priority
              className="h-11 w-auto sm:h-14"
            />
          </Link>

          <DesktopNav />

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={site.phone.href}
              className="rounded-md px-2 py-2 text-sm font-semibold text-brand-700 hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:px-3"
            >
              <span className="sr-only">Call </span>
              {site.phone.display}
            </a>
            <QuoteCta className="hidden rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 lg:inline-block">
              Get a quote
            </QuoteCta>
            <MobileMenu />
          </div>
        </div>
      </Container>
    </header>
  );
}
