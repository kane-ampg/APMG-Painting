import { distanceKm, type Coords } from './haversine';

export type { Coords };

export type StateKey = 'VIC' | 'QLD';
export type AnchorKey = 'bayswater-north' | 'brisbane' | 'southport' | 'maroochydore';

export type Anchor = {
  key: AnchorKey;
  label: string;
  state: StateKey;
  coords: Coords;
  radiusKm: number;
};

/** Spec §5. Coordinates and radii are used verbatim; do not round them. */
export const ANCHORS: readonly Anchor[] = [
  {
    key: 'bayswater-north',
    label: 'Bayswater North',
    state: 'VIC',
    coords: { lat: -37.845116, lng: 145.270141 },
    radiusKm: 50,
  },
  {
    key: 'brisbane',
    label: 'Brisbane',
    state: 'QLD',
    coords: { lat: -27.4698, lng: 153.0251 },
    radiusKm: 40,
  },
  {
    key: 'southport',
    label: 'Gold Coast',
    state: 'QLD',
    coords: { lat: -27.968, lng: 153.4 },
    radiusKm: 40,
  },
  {
    key: 'maroochydore',
    label: 'Sunshine Coast',
    state: 'QLD',
    coords: { lat: -26.66, lng: 153.093 },
    radiusKm: 40,
  },
] as const;

/**
 * Nearest in-radius anchor within the same state.
 *
 * State-scoped so a border locality cannot be pulled across, and nearest-wins
 * so overlapping radii (Caboolture sits in both Brisbane's and the Sunshine
 * Coast's) still yield exactly one URL per locality.
 */
export function nearestAnchor(
  c: Coords,
  state: StateKey,
): { anchor: Anchor; distanceKm: number } | null {
  let best: { anchor: Anchor; distanceKm: number } | null = null;
  for (const anchor of ANCHORS) {
    if (anchor.state !== state) continue;
    const d = distanceKm(anchor.coords, c);
    if (d > anchor.radiusKm) continue;
    if (!best || d < best.distanceKm) best = { anchor, distanceKm: d };
  }
  return best;
}
