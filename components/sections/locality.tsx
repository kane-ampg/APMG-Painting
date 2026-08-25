import Link from 'next/link';
import type { ReactNode } from 'react';
import { projects } from '@/content/projects';
import type { Project } from '@/lib/content/types';
import { ANCHORS, type Coords } from '@/lib/geo/anchors';
import { distanceKm } from '@/lib/geo/haversine';
import {
  displayName,
  getLocalityByHref,
  getRegion,
  hrefForVicSlug,
  type Locality,
} from '@/lib/locations';
import { Card, SectionHeading } from '@/components/ui';

/**
 * The shared, presentational pieces of a locality page.
 *
 * Everything here takes a `Locality` and renders it. Nothing fetches, and
 * nothing decides indexability — that is settled in lib/locations.
 *
 * Queensland copy discipline (spec §9): APMG has no Queensland address, no
 * Queensland phone number and no completed Queensland project. Any sentence
 * that could imply a footprint branches on `locality.state`, and Queensland
 * copy describes the place and what APMG services rather than a presence in it.
 */

/**
 * Distance bucketed into a drive band.
 *
 * A precise "23.4km" reads as false precision on a page nobody measured the
 * drive for, and it is the band a facilities manager actually cares about:
 * whether a crew can be on site within the hour.
 */
export function driveBand(distanceKm: number): string {
  if (distanceKm < 15) return 'under 20 minutes';
  if (distanceKm < 30) return '20 to 40 minutes';
  if (distanceKm < 45) return '40 to 60 minutes';
  return 'over an hour';
}

function anchorLabel(anchorKey: string): string {
  return ANCHORS.find((a) => a.key === anchorKey)?.label ?? 'Melbourne';
}

/** Whole kilometres above 10, one decimal below — 0.4km is a fact, 23.4km is noise. */
function km(value: number): string {
  return value < 10 ? `${value.toFixed(1)}km` : `${Math.round(value)}km`;
}

/**
 * Project positions, resolved through relatedLocationSlugs.
 *
 * content/projects.ts carries no coordinates — only a `location` string and
 * `relatedLocationSlugs`. Those slugs are un-prefixed and match the generated
 * locality slugs, so a project's position is its related locality's position.
 *
 * State-qualified to VIC: every documented APMG project is Victorian, and
 * 'brighton' alone would resolve to Queensland's Brighton just as readily.
 * Two of the four projects carry an empty `relatedLocationSlugs`, so the
 * locality half of the `location` string ("Noble Park, Victoria") is tried as
 * a second key — transcribed, not guessed. A project that still resolves to
 * nothing (the NDIS programme, whose location is "Across metropolitan
 * Melbourne") has no position and is excluded rather than given a made-up one.
 */
export function projectPositions(): { project: Project; coords: Coords }[] {
  return projects.flatMap((project) => {
    const suburb = project.location.split(',')[0] ?? '';
    const candidates = [
      ...project.relatedLocationSlugs,
      suburb
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    ];
    for (const slug of candidates) {
      const href = hrefForVicSlug(slug);
      const locality = href ? getLocalityByHref(href) : undefined;
      if (locality) return [{ project, coords: locality.coords }];
    }
    return [];
  });
}

const POSITIONS = projectPositions();

/** Nearest documented project to a locality, with the distance to it. */
export function nearestProject(locality: Locality): { project: Project; km: number } | undefined {
  let best: { project: Project; km: number } | undefined;
  for (const { project, coords } of POSITIONS) {
    const d = distanceKm(locality.coords, coords);
    if (!best || d < best.km) best = { project, km: d };
  }
  return best;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-label text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

const factLink =
  'rounded underline decoration-paper-edge underline-offset-4 hover:decoration-brand-600 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600';

/** Region, council, postcode and the distance band — the page's quick facts. */
export function LocalityFacts({ locality }: { locality: Locality }) {
  const label = anchorLabel(locality.anchorKey);
  const band = driveBand(locality.distanceKm);
  const state = locality.state === 'VIC' ? 'victoria' : 'queensland';

  return (
    <Card>
      <dl className="grid gap-5 sm:grid-cols-2">
        <Fact label="Region">
          <Link href={`/areas/${state}/${locality.regionSlug}/`} className={factLink}>
            {getRegion(locality.regionSlug)?.name ?? locality.regionSlug}
          </Link>
        </Fact>
        <Fact label={locality.postcodes.length > 1 ? 'Postcodes' : 'Postcode'}>
          {locality.postcodes.join(', ')}
        </Fact>
        <Fact label="Local government area">{locality.council.name}</Fact>
        <Fact label="Distance">
          {/* "a drive of under 20 minutes", not "roughly a under 20 minutes
              drive" — the band is a phrase, not an adjective. */}
          {locality.state === 'VIC'
            ? `${km(locality.distanceKm)} from our ${label} base — a drive of ${band}.`
            : `${km(locality.distanceKm)} from ${label} — a drive of ${band}.`}
        </Fact>
      </dl>
    </Card>
  );
}

/** Council building stock and the operational note that follows from it. */
export function CouncilBlock({ locality }: { locality: Locality }) {
  return (
    <div>
      <SectionHeading className="mb-4">{locality.council.name} building stock</SectionHeading>
      <div className="max-w-prose space-y-4 text-ink-soft">
        <p>{locality.council.buildingStock}</p>
        <p>{locality.council.note}</p>
      </div>
    </div>
  );
}

/**
 * Nearest documented project.
 *
 * Victoria only. Every documented APMG project is Victorian, so on a
 * Queensland page the nearest one is over a thousand kilometres away, and
 * printing that distance beside a Queensland suburb name would read as a claim
 * about work there. The block states the absence plainly instead.
 */
export function NearestProjectBlock({ locality }: { locality: Locality }) {
  const name = displayName(locality.name);
  const nearest = locality.state === 'VIC' ? nearestProject(locality) : undefined;

  return (
    <div>
      <SectionHeading className="mb-4">Nearest documented project</SectionHeading>
      <div className="max-w-prose space-y-4 text-ink-soft">
        {nearest ? (
          <p>
            The closest project written up on this site is{' '}
            <Link href={`/projects/${nearest.project.slug}/`} className={factLink}>
              {nearest.project.title}
            </Link>
            {/* A project resolved to this very locality is 0.0km away, and
                "about 0.0km from Vermont" is not a fact anyone can use. */}
            {nearest.km < 1 ? `, in ${name} itself.` : `, about ${km(nearest.km)} from ${name}.`}
          </p>
        ) : (
          <p>
            No Queensland project is documented on this site. The case studies here are Victorian,
            and are published as a record of that work rather than as a claim about {name}.{' '}
            <Link href="/projects/" className={factLink}>
              See the projects
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}

/** The six nearest localities, as links. Traversable from noindex pages too. */
export function NearbySuburbs({ locality }: { locality: Locality }) {
  const neighbours = locality.neighbourHrefs
    .map((href) => getLocalityByHref(href))
    .filter((l): l is Locality => l !== undefined);

  if (neighbours.length === 0) return null;

  return (
    <div>
      <SectionHeading className="mb-4">Nearby suburbs</SectionHeading>
      <ul className="flex flex-wrap gap-2">
        {neighbours.map((neighbour) => (
          <li key={neighbour.href}>
            <Link
              href={neighbour.href}
              className="inline-block rounded-md border border-paper-edge px-3 py-2 text-sm text-ink-soft hover:bg-paper-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              {displayName(neighbour.name)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
