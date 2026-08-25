import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CtaBand } from '@/components/sections';
import { Card, Container, Eyebrow, Lede, Prose, Section, SectionHeading } from '@/components/ui';
import { allLocalities, localitiesInRegion, regionsInState, type StateKey } from '@/lib/locations';

/**
 * The national hub.
 *
 * Indexable, and now a genuine directory: 1,440 localities across two states,
 * 22 regions, all reachable from here in at most two clicks. The editorial
 * placeholder this page used to carry — a caveat that the coverage was a
 * representative subset pending real data — is gone, because the coverage is
 * no longer a subset.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Areas We Service | Commercial Painters VIC & QLD | APMG Painting',
  description:
    'APMG Painting works across metropolitan Melbourne from Bayswater North and services south-east Queensland. Every region and suburb, with the council notes that shape the work.',
  path: '/areas/',
});

const STATES: readonly {
  key: StateKey;
  name: string;
  slug: string;
  blurb: string;
}[] = [
  {
    key: 'VIC',
    name: 'Victoria',
    slug: 'victoria',
    blurb:
      'Metropolitan Melbourne and the Yarra Valley hinterland, worked from our base at Bayswater North. Every documented project on this site is here.',
  },
  {
    key: 'QLD',
    name: 'Queensland',
    slug: 'queensland',
    blurb:
      'South-east Queensland, from Noosa to the Gold Coast. APMG Painting services these areas; no Queensland project is documented on this site yet.',
  },
];

export default function AreasPage() {
  const localities = allLocalities();

  return (
    <>
      <Container width="wide">
        <Breadcrumbs crumbs={[{ name: 'Areas we service', path: '/areas/' }]} />
      </Container>

      <Section tone="sunken" className="py-10" reveal={false}>
        <Container width="wide">
          <Eyebrow>Coverage</Eyebrow>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Areas we service</h1>
          <Lede className="mt-4">
            {localities.length.toLocaleString('en-AU')} suburbs across{' '}
            {regionsInState('VIC').length + regionsInState('QLD').length} regions in two states.
          </Lede>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <ul className="mb-14 grid gap-5 md:grid-cols-2">
            {STATES.map((state) => {
              const count = localities.filter((l) => l.state === state.key).length;
              return (
                <Card
                  as="li"
                  key={state.key}
                  className="gap-3 transition-colors duration-300 focus-within:border-brand-600 hover:border-brand-600 motion-reduce:transition-none"
                >
                  <h2 className="font-display text-2xl tracking-tight">
                    <Link
                      href={`/areas/${state.slug}/`}
                      className="rounded before:absolute before:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                      {state.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-ink-soft">{state.blurb}</p>
                  <p className="mt-auto pt-2 text-xs font-semibold uppercase tracking-label text-ink-muted">
                    {count.toLocaleString('en-AU')} suburbs · {regionsInState(state.key).length}{' '}
                    regions
                  </p>
                </Card>
              );
            })}
          </ul>

          <Prose className="mb-10">
            <p>
              Suburb pages exist for every locality in range, but only a small number of them are
              indexed. A page earns that when it carries something a search engine has not already
              seen a thousand times — a project completed nearby, photography from it, or a local
              detail that genuinely affects the work. The rest stay out of the index and link upward
              to the region hub instead of pretending to be a destination.
            </p>
          </Prose>

          {STATES.map((state) => (
            <div key={state.key} className="mb-12 last:mb-0">
              <SectionHeading className="mb-5 text-2xl sm:text-3xl">
                {state.name} regions
              </SectionHeading>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {regionsInState(state.key).map((region) => (
                  <li key={region.slug}>
                    <Link
                      href={`/areas/${state.slug}/${region.slug}/`}
                      className="flex h-full flex-col gap-1 rounded-lg border border-paper-edge bg-white p-4 hover:border-brand-600 hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                      <span className="font-semibold text-ink">{region.name}</span>
                      <span className="text-xs text-ink-muted">
                        {localitiesInRegion(region.slug).length} suburbs
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
