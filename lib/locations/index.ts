import generated from '@/content/locations.generated.json';
import { getCouncil, type Council } from '@/content/councils';
import { localityOverrides, qldPresence, TIER_1_OVERRIDES } from '@/content/locations.overrides';
import { REGIONS } from './regions';
import type { GeneratedLocality, RegionDef, StateKey, Tier } from './types';

export type Locality = Omit<GeneratedLocality, 'council'> & {
  council: Council;
  intro?: string;
  localNotes?: readonly string[];
  /** Derived, never stored — see below. */
  indexable: boolean;
  href: string;
};

const STATE_SLUGS = { VIC: 'victoria', QLD: 'queensland' } as const;

export function stateSlug(state: StateKey): (typeof STATE_SLUGS)[StateKey] {
  return STATE_SLUGS[state];
}

export function stateFromSlug(slug: string): StateKey | undefined {
  return (Object.keys(STATE_SLUGS) as StateKey[]).find((k) => STATE_SLUGS[k] === slug);
}

/**
 * Indexability is computed, not stored.
 *
 * Storing it in the generated JSON would let it drift from `tier` the first
 * time someone hand-edited one and not the other. There is one rule and it
 * lives here.
 */
function computeIndexable(tier: Tier, l: GeneratedLocality): boolean {
  if (tier !== 1) return false;
  if (l.ruralFringe) return false;
  return l.state === 'VIC' || qldPresence;
}

const ALL: readonly Locality[] = (generated.localities as GeneratedLocality[]).map((l) => {
  const council = getCouncil(l.council);
  if (!council) {
    throw new Error(
      `No council note for "${l.council}" (${l.name}). Add it to content/councils.ts.`,
    );
  }

  // Keyed on state+slug: 13 slugs exist in both states, so a bare-slug key
  // would put Brighton VIC's hand-written copy on Brighton QLD's page.
  const key = `${l.state}|${l.slug}`;
  const override = localityOverrides[key];
  const tier: Tier = TIER_1_OVERRIDES[key] ? 1 : l.tier;

  return {
    ...l,
    tier,
    council,
    intro: override?.intro,
    localNotes: override?.localNotes,
    indexable: computeIndexable(tier, l),
    href: `/areas/${stateSlug(l.state)}/${l.regionSlug}/${l.slug}/`,
  };
});

const BY_URL = new Map(ALL.map((l) => [l.href, l]));

export function allLocalities(): readonly Locality[] {
  return ALL;
}

export function getLocality(state: string, region: string, suburb: string): Locality | undefined {
  return BY_URL.get(`/areas/${state}/${region}/${suburb}/`);
}

/**
 * Title-cases a dataset locality name, which arrives upper-case
 * (`"CHIRNSIDE PARK"`, `"MCKINNON"`).
 *
 * The single place this happens. Every surface that shows a locality name —
 * suburb pages, region/state hubs, the homepage service-area teaser, project
 * pages — imports this rather than title-casing inline, so the `Mc` rule only
 * has to be right once.
 */
export function displayName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bMc([a-z])/g, (_, c: string) => `Mc${c.toUpperCase()}`);
}

/**
 * Lookup by full href, for `neighbourHrefs`.
 *
 * Slugs are only unique per state — 13 cross-state duplicates exist in the
 * dataset — so a consumer resolving a neighbour must go through the full URL,
 * never a bare-slug `find`.
 */
export function getLocalityByHref(href: string): Locality | undefined {
  return BY_URL.get(href);
}

export function localitiesInRegion(regionSlug: string): readonly Locality[] {
  return ALL.filter((l) => l.regionSlug === regionSlug);
}

export function regionsInState(state: StateKey): readonly RegionDef[] {
  return REGIONS.filter((r) => r.state === state);
}

export function getRegion(slug: string): RegionDef | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

export function indexableLocalities(): readonly Locality[] {
  return ALL.filter((l) => l.indexable);
}

/**
 * Resolve a bare, un-prefixed slug against Victoria only.
 *
 * Bare slugs survive in `content/projects.ts` (`relatedLocationSlugs`), which
 * predates the two-state dataset. Thirteen slugs exist in both states, so an
 * unqualified lookup would resolve Brighton to Queensland as readily as to
 * Victoria; every documented APMG project is Victorian, so Victoria is the
 * only correct scope for that resolution.
 */
export function hrefForVicSlug(slug: string): string | undefined {
  return ALL.find((l) => l.state === 'VIC' && l.slug === slug)?.href;
}

export { REGIONS };
export type { RegionDef, StateKey };
