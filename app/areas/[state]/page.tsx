import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CtaBand, RelatedLinks } from '@/components/sections';
import { Card, Container, Eyebrow, Lede, Prose, Section, SectionHeading } from '@/components/ui';
import { sectors } from '@/content/sectors';
import {
  allLocalities,
  localitiesInRegion,
  regionsInState,
  stateFromSlug,
  type StateKey,
} from '@/lib/locations';

/**
 * State hubs — two of them, both indexable.
 *
 * The state level exists because the two states are not the same offer.
 * Victoria is where APMG is; Queensland is coverage. Keeping them apart at the
 * URL level is what lets the Queensland copy stay honest without hedging every
 * Victorian sentence too.
 */
export function generateStaticParams() {
  return [{ state: 'victoria' }, { state: 'queensland' }];
}

export const dynamicParams = false;

type Props = { params: Promise<{ state: string }> };

const NAMES: Record<StateKey, string> = { VIC: 'Victoria', QLD: 'Queensland' };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const key = stateFromSlug(state);
  if (!key) return {};

  const suburbs = allLocalities().filter((l) => l.state === key).length;

  return buildMetadata({
    title:
      key === 'VIC'
        ? 'Commercial Painters Victoria | APMG Painting'
        : 'Commercial Painting Queensland | APMG Painting',
    description:
      key === 'VIC'
        ? `Commercial painting across ${suburbs} Victorian suburbs, from APMG Painting's Bayswater North base. Schools, clinics, retail, strata and industrial.`
        : `Commercial painting across ${suburbs} south-east Queensland suburbs APMG Painting services, from Noosa to the Gold Coast.`,
    path: `/areas/${state}/`,
    index: true,
  });
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const key = stateFromSlug(state);
  if (!key) notFound();

  const vic = key === 'VIC';
  const regions = regionsInState(key);
  const suburbs = allLocalities().filter((l) => l.state === key).length;

  return (
    <>
      <Container width="wide">
        <Breadcrumbs
          crumbs={[
            { name: 'Areas we service', path: '/areas/' },
            { name: NAMES[key], path: `/areas/${state}/` },
          ]}
        />
      </Container>

      <Section tone="sunken" className="py-10" reveal={false}>
        <Container width="wide">
          <Eyebrow>Areas we service</Eyebrow>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            {vic ? 'Commercial painters in Victoria' : 'Commercial painting in Queensland'}
          </h1>
          <Lede className="mt-4">
            {vic
              ? `${regions.length} regions and ${suburbs.toLocaleString('en-AU')} suburbs, worked from our base at Bayswater North.`
              : `${regions.length} regions and ${suburbs.toLocaleString('en-AU')} south-east Queensland suburbs APMG Painting services.`}
          </Lede>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <Prose className="mb-10">
            {vic ? (
              <>
                <p>
                  APMG Painting has worked across metropolitan Melbourne since 2015 from Bayswater
                  North, on schools and childcare centres, medical and allied health suites, retail
                  tenancies, strata buildings and industrial units. Commercial work, not houses.
                </p>
                <p>
                  The regions below group suburbs by the councils that govern their building stock,
                  because a council&rsquo;s stock and its planning behaviour change how a repaint is
                  scoped far more than a suburb boundary does.
                </p>
              </>
            ) : (
              <>
                <p>
                  APMG Painting services south-east Queensland for commercial work. Every project
                  documented on this site is Victorian, and nothing on these pages should be read as
                  a claim otherwise — what is described is the building stock, the exposure
                  conditions and how work is scoped in each council area.
                </p>
                <p>
                  Subtropical conditions change the job: mould on shaded elevations is routine
                  preparation rather than an exception, salt exposure governs coating selection on
                  the coastal strip, and external stages get planned around the summer storm season.
                </p>
              </>
            )}
          </Prose>

          <SectionHeading className="mb-6">Regions</SectionHeading>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((region) => {
              const count = localitiesInRegion(region.slug).length;
              return (
                <Card
                  as="li"
                  key={region.slug}
                  className="group gap-2 transition-colors duration-300 focus-within:border-brand-600 hover:border-brand-600 motion-reduce:transition-none"
                >
                  <h3 className="font-display text-xl tracking-tight">
                    <Link
                      href={`/areas/${state}/${region.slug}/`}
                      className="rounded before:absolute before:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                      {region.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-ink-muted">
                    {count} {count === 1 ? 'suburb' : 'suburbs'}
                    {region.ruralFringe ? ' · rural and hinterland' : ''}
                  </p>
                </Card>
              );
            })}
          </ul>

          <div className="mt-14">
            <RelatedLinks
              heading="Commercial sectors we work in"
              links={sectors.map((sector) => ({
                label: sector.shortTitle,
                href: sector.legacyPath,
              }))}
            />
          </div>
        </Container>
      </Section>

      <CtaBand
        heading={vic ? 'Painting in Victoria?' : 'Painting in Queensland?'}
        body="Tell us what needs doing and we will come and look."
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
      />
    </>
  );
}
