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
