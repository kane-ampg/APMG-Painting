import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CtaBand, RelatedLinks } from '@/components/sections';
import { Container, Eyebrow, Lede, Prose, Section, SectionHeading } from '@/components/ui';
import { sectors } from '@/content/sectors';
import { getCouncil } from '@/content/councils';
import {
  displayName,
  getRegion,
  localitiesInRegion,
  REGIONS,
  stateFromSlug,
  stateSlug,
  type Locality,
} from '@/lib/locations';

/**
 * Region hubs — 22 of them, and all indexable.
 *
 * These are the pages that are meant to rank: a region is a real unit of
 * enquiry ("commercial painters eastern suburbs Melbourne") and there are few
 * enough of them that each can carry genuine writing. The 1,440 suburb pages
 * beneath sit at `noindex, follow` precisely so their links point equity here.
 */
export function generateStaticParams() {
  return REGIONS.map((region) => ({
    state: stateSlug(region.state),
    region: region.slug,
  }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ state: string; region: string }> };

/** Regions are named for their place, so the heading must not repeat "Melbourne". */
function heading(regionName: string, vic: boolean): string {
  return `Commercial ${vic ? 'painters in' : 'painting in'} ${regionName}`;
}

function resolve(state: string, region: string) {
  const stateKey = stateFromSlug(state);
  const regionDef = getRegion(region);
  if (!stateKey || !regionDef || regionDef.state !== stateKey) return undefined;
  return regionDef;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, region } = await params;
  const regionDef = resolve(state, region);
  if (!regionDef) return {};

  const vic = regionDef.state === 'VIC';
  const count = localitiesInRegion(regionDef.slug).length;

  return buildMetadata({
    title: `Commercial ${vic ? 'Painters' : 'Painting'} ${regionDef.name} | APMG Painting`,
    description: vic
      ? `Commercial painting across ${regionDef.name} — ${count} suburbs, serviced from APMG Painting's Bayswater North base. Schools, clinics, retail, strata and industrial.`
      : `Commercial painting across ${regionDef.name} — ${count} suburbs APMG Painting services. Schools, clinics, retail, strata and industrial.`,
    path: `/areas/${state}/${region}/`,
    // Hubs are always indexable: 22 pages, each with real writing behind it.
    index: true,
  });
}

/** Suburbs grouped by their council, so a 140-suburb region reads as something. */
function byCouncil(localities: readonly Locality[]): [string, Locality[]][] {
  const groups = new Map<string, Locality[]>();
  for (const locality of localities) {
    const bucket = groups.get(locality.council.name);
    if (bucket) bucket.push(locality);
    else groups.set(locality.council.name, [locality]);
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

export default async function RegionPage({ params }: Props) {
  const { state, region } = await params;
  const regionDef = resolve(state, region);
  if (!regionDef) notFound();

  const vic = regionDef.state === 'VIC';
  const localities = [...localitiesInRegion(regionDef.slug)].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const groups = byCouncil(localities);

  return (
    <>
      <Container width="wide">
        <Breadcrumbs
          crumbs={[
            { name: 'Areas we service', path: '/areas/' },
            { name: vic ? 'Victoria' : 'Queensland', path: `/areas/${state}/` },
            { name: regionDef.name, path: `/areas/${state}/${region}/` },
          ]}
        />
      </Container>

      <Section tone="sunken" className="py-10" reveal={false}>
        <Container width="wide">
          <Eyebrow>{vic ? 'Victoria' : 'Queensland'}</Eyebrow>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            {heading(regionDef.name, vic)}
          </h1>
          <Lede className="mt-4">
            {vic
              ? `${localities.length} suburbs across ${groups.length} ${groups.length === 1 ? 'council' : 'councils'}, serviced from our Bayswater North base.`
              : `${localities.length} suburbs across ${groups.length} ${groups.length === 1 ? 'council' : 'councils'} that APMG Painting services.`}
          </Lede>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <Prose className="mb-10">
            <p>
              {vic
                ? `APMG Painting works right across ${regionDef.name} — schools and childcare centres, medical suites, retail tenancies, strata buildings and industrial units. Not houses.`
                : `APMG Painting services ${regionDef.name} for commercial work — schools and childcare centres, medical suites, retail tenancies, strata buildings and industrial units. Not houses.`}
            </p>
            <p>
              Scope is set by the council the building sits under more than by the suburb name, so
              each suburb page below carries its council&rsquo;s building stock and the operational
              note that goes with it, along with the postcodes, the drive band and the nearest
              project documented on this site.
            </p>
          </Prose>

          <div className="flex flex-col gap-10">
            {groups.map(([council, group]) => {
              const note = getCouncil(council);
              return (
                <div key={council}>
                  <SectionHeading className="mb-2 text-2xl sm:text-3xl">
                    {council} council
                  </SectionHeading>
                  {note && <p className="mb-5 max-w-prose text-ink-soft">{note.buildingStock}</p>}
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((locality) => (
                      <li key={locality.href}>
                        <Link
                          href={locality.href}
                          className="block rounded-md border border-paper-edge bg-white px-3 py-2 text-sm text-ink-soft hover:border-brand-600 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        >
                          {displayName(locality.name)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

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
        heading={`Painting in ${regionDef.name}?`}
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
