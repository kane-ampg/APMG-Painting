import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CtaBand } from '@/components/sections';
import { Container, Placeholder, Prose, Section } from '@/components/ui';
import { locationsByRegion } from '@/content/locations';

/**
 * Areas hub.
 *
 * This page stays indexable — it is a genuine directory. The individual suburb
 * pages beneath it are indexable only where they carry real evidence, which is
 * decided per record in content/locations.ts, not per route.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Areas We Service | Melbourne Painters | APMG Painting',
  description:
    'APMG Painting works across metropolitan Melbourne from Bayswater North. Suburbs and regions we service, with links to projects completed nearby.',
  path: '/areas/',
});

export default function AreasPage() {
  const byRegion = locationsByRegion();

  return (
    <>
      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <Breadcrumbs crumbs={[{ name: 'Areas we service', path: '/areas/' }]} />
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Areas we service</h1>
          <p className="mt-4 max-w-prose text-lg text-ink-soft">
            We work across metropolitan Melbourne from our base at Bayswater North.
          </p>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <Prose className="mb-8">
            <p>
              Suburb pages only exist here where there is something real to say — a project we
              completed nearby, photography from it, or a local detail that actually affects the
              work. Where there is not, the page is not indexed and does not pretend otherwise.
            </p>
          </Prose>

          <div className="mb-10">
            <Placeholder note="this is a representative subset. The full sort of all 68 existing suburb pages into keep / consolidate / noindex / redirect needs APMG's real project list plus Search Console impression data. Neither is available yet, and guessing is not a substitute." />
          </div>

          <div className="flex flex-col gap-10">
            {[...byRegion.entries()].map(([region, locations]) => (
              <div key={region}>
                <h2 className="mb-4 font-display text-2xl tracking-tight">{region}</h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {locations.map((location) => (
                    <li key={location.slug}>
                      <Link
                        href={`/areas/${location.slug}/`}
                        className="flex h-full flex-col gap-1 rounded-lg border border-paper-edge bg-white p-4 hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        <span className="font-semibold text-ink">{location.suburb}</span>
                        <span className="text-xs text-ink-muted">
                          {location.projectSlugs.length > 0
                            ? `${location.projectSlugs.length} project${location.projectSlugs.length === 1 ? '' : 's'} nearby`
                            : 'No project documented yet'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand
        heading="Not sure if you are in range?"
        body="Call and ask — it is a faster answer than a form."
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
      />
    </>
  );
}
