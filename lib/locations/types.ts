import type { Coords, StateKey } from '../geo/anchors';

export type { Coords, StateKey };

/**
 * Two tiers, not three.
 *
 * Tier 1 is indexable and hand-written; Tier 3 is noindex and templated.
 * The spec numbers them 1 and 3 with no 2 on purpose: region hubs occupy the
 * middle of the hierarchy but are a different entity with their own route, not
 * a tier of suburb. Renumbering to 1/2 would invite someone to conflate them.
 */
export type Tier = 1 | 3;

export type RegionDef = {
  slug: string;
  name: string;
  state: StateKey;
  /**
   * The name as it reads inside a sentence, definite article included.
   *
   * Region headings used to be built as `Commercial painting in ${name}`, which
   * produced "Commercial painting in Gold Coast" — nobody writes that. The
   * article is a property of the place, not a string to special-case at one
   * call site, so it lives here beside the name and every surface that puts the
   * region into a sentence reads it. Omitted where `name` already reads
   * correctly, which is 15 of the 22.
   */
  inSentence?: string;
  /**
   * The preposition that goes with `inSentence`. "on the Gold Coast", not "in
   * the Gold Coast"; "across Bayside & the Peninsula", because it is two
   * places. Defaults to "in".
   */
  preposition?: 'in' | 'on' | 'across';
  /** Matched verbatim against the dataset's `lgaregion`. */
  councils: readonly string[];
  ruralFringe: boolean;
};

/** One locality, as emitted by scripts/build-locations.mjs. */
export type GeneratedLocality = {
  slug: string;
  name: string;
  state: StateKey;
  postcodes: readonly string[];
  coords: Coords;
  council: string;
  anchorKey: string;
  distanceKm: number;
  regionSlug: string;
  ruralFringe: boolean;
  tier: Tier;
  /**
   * Full site-relative URLs (`/areas/{state}/{region}/{suburb}/`), not
   * bare slugs. A bare slug is ambiguous across states (Victoria's Brighton,
   * Queensland's Brighton both slugify to `brighton`) and a consumer doing a
   * naive `find(l => l.slug === s)` would silently resolve to the wrong
   * state's locality. A full href is unambiguous by construction.
   */
  neighbourHrefs: readonly string[];
};
