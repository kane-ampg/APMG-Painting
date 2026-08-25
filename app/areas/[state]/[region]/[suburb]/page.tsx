import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CtaBand, RelatedLinks } from '@/components/sections';
import {
  CouncilBlock,
  LocalityFacts,
  NearbySuburbs,
  NearestProjectBlock,
} from '@/components/sections/locality';
import { Container, Eyebrow, Lede, Prose, Section } from '@/components/ui';
import { sectors } from '@/content/sectors';
import { allLocalities, displayName, getLocality, getRegion, stateSlug } from '@/lib/locations';

/**
 * Suburb pages — 1,440 of them, one per locality in the merged dataset.
 *
 * Flat `{ state, region, suburb }` objects covering all three segments, which
 * is the documented shape for multiple dynamic segments; no parent chaining is
 * required. `dynamicParams = false` means anything outside this list is a real
 * 404 rather than a rendered page for a suburb we have no data for.
 *
 * Indexability comes from the data (`locality.indexable`), never from the
 * route: 16 of these are Tier 1. The other 1,424 are `noindex, follow` — they
 * must stay traversable, because the links out of them to the region hubs are
 * how the hubs earn their internal link equity.
 */
export function generateStaticParams() {
  return allLocalities().map((l) => ({
    state: stateSlug(l.state),
    region: l.regionSlug,
    suburb: l.slug,
  }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ state: string; region: string; suburb: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, region, suburb } = await params;
  const locality = getLocality(state, region, suburb);
  if (!locality) return {};

  const name = displayName(locality.name);
  const vic = locality.state === 'VIC';

  return buildMetadata({
    title: `Commercial ${vic ? 'Painters' : 'Painting'} ${name} | APMG Painting`,
    description:
      locality.intro?.slice(0, 155) ??
      (vic
        ? `Commercial painting in ${name}, ${locality.council.name} council. APMG Painting services ${name} from our Bayswater North base.`
        : `Commercial painting in ${name}, ${locality.council.name} council. APMG Painting services ${name} — building stock, access and coating notes.`),
    path: locality.href,
    // Data-driven: Tier 3 pages are noindex until they earn otherwise.
    index: locality.indexable,
  });
}

export default async function SuburbPage({ params }: Props) {
  const { state, region, suburb } = await params;
  const locality = getLocality(state, region, suburb);
  if (!locality) notFound();

  const regionDef = getRegion(locality.regionSlug);
  const regionName = regionDef?.name ?? region;
  const name = displayName(locality.name);
  const vic = locality.state === 'VIC';

  return (
    <>
      <Container width="wide">
        <Breadcrumbs
          crumbs={[
            { name: 'Areas we service', path: '/areas/' },
            { name: vic ? 'Victoria' : 'Queensland', path: `/areas/${state}/` },
            { name: regionName, path: `/areas/${state}/${region}/` },
            { name, path: locality.href },
          ]}
        />
      </Container>

      <Section tone="sunken" className="py-10" reveal={false}>
        <Container width="wide">
          <Eyebrow>{regionName}</Eyebrow>
          {/* One H1, and it names the suburb once. The live pages render
              "Painters Painters Armadale" and "Painting Brighton". */}
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            {`Commercial ${vic ? 'painters' : 'painting'} in ${name}`}
          </h1>
          <Lede className="mt-4">
            {/* Queensland has no APMG address, phone number or completed
                project, so Queensland copy says what is serviced, never where
                the business sits. */}
            {vic
              ? `Interior and exterior commercial painting across ${name} and the surrounding ${regionName} area.`
              : `APMG Painting services ${name} for interior and exterior commercial painting.`}
          </Lede>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Prose>
              {locality.intro ? (
                <p>{locality.intro}</p>
              ) : (
                <p>
                  {vic
                    ? `APMG Painting services ${name} and the surrounding ${regionName} area from our base at Bayswater North. Schools, medical suites, retail tenancies, strata buildings and industrial units — the commercial stock, not houses.`
                    : `APMG Painting services ${name}, in the ${locality.council.name} local government area. Schools, medical suites, retail tenancies, strata buildings and industrial units — the commercial stock, not houses.`}
                </p>
              )}
              {locality.localNotes?.map((note) => (
                <p key={note}>{note}</p>
              ))}
              <p>
                What follows is what actually changes the scope here: the council the building stock
                sits under, the postcodes and region {name} belongs to, the distance and drive band,
                and the nearest project documented on this site.
              </p>
            </Prose>

            <LocalityFacts locality={locality} />
          </div>
        </Container>
      </Section>

      <Section tone="sunken">
        <Container>
          <CouncilBlock locality={locality} />
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <NearestProjectBlock locality={locality} />
            <NearbySuburbs locality={locality} />
          </div>
          <div className="mt-12">
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
        heading={`Painting in ${name}?`}
        body={
          vic
            ? 'Tell us what needs doing and we will come and look.'
            : 'Tell us about the site and we will tell you how we would approach it.'
        }
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
      />
    </>
  );
}
