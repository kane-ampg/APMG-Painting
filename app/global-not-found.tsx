import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { site } from '@/lib/site';

/**
 * The 404 for a URL that matches no route at all.
 *
 * Needed because the app has two root layouts — `app/(site)/layout.tsx` and
 * `app/admin/layout.tsx` — so there is no single layout Next could compose a
 * root `not-found.tsx` into. That is the case the Next docs name for
 * `global-not-found`, and it must return the whole document itself, styles
 * and fonts included.
 *
 * `app/(site)/not-found.tsx` still handles `notFound()` raised inside a
 * public route (an unknown project or post slug) and keeps the header and
 * footer around it. This one is deliberately self-contained: it renders
 * without reading the database, so a URL nobody asked for cannot cost a
 * query.
 *
 * Worth noting why this page matters more than usual here: on the live
 * WordPress site every unknown URL returns HTTP 500, not 404, so dead URLs
 * can never be dropped from the index.
 */

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: `Page not found | ${site.name}`,
  robots: { index: false, follow: false },
};

const destinations = [
  {
    label: 'Commercial painting',
    href: '/commercial/',
    body: 'Schools, healthcare, strata, retail and industrial sites.',
  },
  {
    label: 'Trade services',
    href: '/trade-services/',
    body: 'Coordinating the work that runs alongside a painting programme.',
  },
  { label: 'Projects', href: '/projects/', body: 'Documented case studies from completed work.' },
  { label: 'Contact', href: '/contact-us/', body: 'Site assessments and quotes.' },
];

export default function GlobalNotFound() {
  return (
    <html lang="en-AU" className={`${sans.variable} ${display.variable}`}>
      <body className="bg-paper font-sans text-ink">
        <main className="mx-auto max-w-2xl px-6 py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-label text-brand-600">
            Page not found
          </p>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            That page is not here
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            The link may be out of date, or the address may have a typo in it. Here is where most
            people are heading.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {destinations.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex h-full flex-col gap-1 rounded-lg border border-paper-edge bg-white p-5 hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  <span className="font-semibold text-ink">{item.label}</span>
                  <span className="text-sm text-ink-soft">{item.body}</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8">
            <Link href="/" className="font-semibold text-brand-700 hover:underline">
              Back to the homepage
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
