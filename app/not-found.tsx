import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink, Container, Section } from '@/components/ui';
import { site } from '@/lib/site';

// Without its own title this page inherits the layout default — the site's
// money-keyword title on an HTTP 404. The template appends the brand.
export const metadata: Metadata = {
  title: 'Page not found',
  description:
    'That page does not exist. The commercial painting, projects and service-area pages are one click away.',
};

/**
 * 404.
 *
 * Worth noting why this page matters more than usual here: on the live
 * WordPress site every unknown URL returns HTTP 500, not 404, so dead URLs can
 * never be dropped from the index. This returns a real 404 and offers a route
 * onward rather than a dead end.
 */
export default function NotFound() {
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

  return (
    <Section tone="paper">
      <Container width="narrow">
        <p className="mb-3 text-xs font-semibold uppercase tracking-label text-brand-600">
          Page not found
        </p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">That page is not here</h1>
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

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <ButtonLink href="/">Back to the homepage</ButtonLink>
          <a href={site.phone.href} className="font-semibold text-brand-700 hover:underline">
            Or call {site.phone.display}
          </a>
        </div>
      </Container>
    </Section>
  );
}
