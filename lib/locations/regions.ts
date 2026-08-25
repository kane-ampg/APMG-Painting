import { bearingDeg, distanceKm } from '../geo/haversine';
import type { Coords, RegionDef, StateKey } from './types';

/** Localities in these councils are dropped: geographically impossible (spec §5.1). */
export const IMPOSSIBLE_COUNCILS: readonly string[] = ['Surf Coast', 'South Gippsland'];

/** Councils allowed to contribute <= 2 localities without failing the build (spec §5.1). */
export const SINGLE_LOCALITY_COUNCIL_ALLOWLIST: readonly string[] = [
  'Melton',
  'Mitchell',
  'Somerset',
];

/** Spec §5.2. Everything else in Cardinia is fringe. */
export const CARDINIA_URBAN: readonly string[] = [
  'PAKENHAM',
  'PAKENHAM UPPER',
  'OFFICER',
  'OFFICER SOUTH',
  'BEACONSFIELD',
  'BEACONSFIELD UPPER',
  'BUNYIP',
  'KOO WEE RUP',
  'LANG LANG',
  'EMERALD',
  'COCKATOO',
];

/** Spec §5.2. Chirnside Park is here because it is APMG's own base. */
export const YARRA_RANGES_URBAN: readonly string[] = [
  'LILYDALE',
  'MOOROOLBARK',
  'CHIRNSIDE PARK',
  'MONTROSE',
  'KILSYTH SOUTH',
  // task-6-ruling-2.md: council was already correct, just missing here.
  'MOUNT EVELYN',
  'HEALESVILLE',
  'YARRA GLEN',
  'SEVILLE',
  'WANDIN NORTH',
  'WOORI YALLOCK',
  'BELGRAVE',
  'UPWEY',
  'TECOMA',
  'FERNY CREEK',
  'OLINDA',
];

/** Councils whose every locality is fringe. */
const WHOLLY_FRINGE_COUNCILS: readonly string[] = [
  'Scenic Rim',
  'Nillumbik',
  'Gympie',
  'Murrindindi',
  'Baw Baw',
  'Somerset',
];

const SPLIT_COUNCIL_URBAN: Record<string, readonly string[]> = {
  Cardinia: CARDINIA_URBAN,
  'Yarra Ranges': YARRA_RANGES_URBAN,
};

/**
 * Moreton Bay ferry-access islands. These are Redland localities, and Redland
 * is not a fringe council, so the council-level check above never sees them.
 * They stay in the dataset (they are inside the Brisbane radius, spec says
 * they get a page) but are ferry access only with negligible commercial
 * building stock, so they must always resolve rural fringe and stay
 * non-indexable regardless of council.
 */
const RURAL_FRINGE_LOCALITIES: readonly string[] = [
  'RUSSELL ISLAND',
  'MACLEAY ISLAND',
  'LAMB ISLAND',
  'KARRAGARRA ISLAND',
  'PERULPA ISLAND',
  'PEEL ISLAND',
  'COOCHIEMUDLO ISLAND',
  'DUNWICH',
];

export function isRuralFringe(council: string, locality: string): boolean {
  if (WHOLLY_FRINGE_COUNCILS.includes(council)) return true;
  if (RURAL_FRINGE_LOCALITIES.includes(locality.toUpperCase())) return true;
  const urban = SPLIT_COUNCIL_URBAN[council];
  if (urban) return !urban.includes(locality.toUpperCase());
  return false;
}

/**
 * Brisbane City Council is 307 localities in one LGA, so it cannot be a region.
 * It splits on distance first (an inner core) then bearing (four quadrants).
 */
const BRISBANE_CBD: Coords = { lat: -27.4698, lng: 153.0251 };
const BRISBANE_INNER_RADIUS_KM = 5;

function brisbaneSubRegion(coords: Coords): string {
  if (distanceKm(BRISBANE_CBD, coords) <= BRISBANE_INNER_RADIUS_KM) return 'brisbane-inner';
  const b = bearingDeg(BRISBANE_CBD, coords);
  if (b >= 315 || b < 45) return 'brisbane-north';
  if (b < 135) return 'brisbane-east';
  if (b < 225) return 'brisbane-south';
  return 'brisbane-west';
}

export const REGIONS: readonly RegionDef[] = [
  // --- Victoria: 8 metropolitan + 1 hinterland ---
  {
    slug: 'inner-melbourne',
    name: 'Inner Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Melbourne', 'Port Phillip', 'Yarra'],
  },
  {
    slug: 'inner-east',
    name: 'Inner East',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Boroondara', 'Stonnington'],
  },
  {
    slug: 'eastern',
    name: 'Eastern Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Whitehorse', 'Manningham', 'Maroondah', 'Knox', 'Yarra Ranges'],
  },
  {
    slug: 'south-east',
    name: 'South East Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Monash', 'Greater Dandenong', 'Casey', 'Cardinia'],
  },
  {
    slug: 'bayside-and-peninsula',
    name: 'Bayside & Peninsula',
    state: 'VIC',
    ruralFringe: false,
    councils: [
      'Bayside (Vic.)',
      'Glen Eira',
      'Kingston (Vic.)',
      'Frankston',
      'Mornington Peninsula',
    ],
  },
  {
    slug: 'northern',
    name: 'Northern Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Darebin', 'Banyule', 'Whittlesea', 'Moreland'],
  },
  {
    slug: 'north-west',
    name: 'North West Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Hume', 'Moonee Valley', 'Melton', 'Mitchell'],
  },
  {
    slug: 'western',
    name: 'Western Melbourne',
    state: 'VIC',
    ruralFringe: false,
    councils: ['Brimbank', 'Maribyrnong', 'Hobsons Bay', 'Wyndham'],
  },
  {
    slug: 'yarra-valley-and-hinterland',
    name: 'Yarra Valley & Hinterland',
    state: 'VIC',
    ruralFringe: true,
    councils: ['Yarra Ranges', 'Nillumbik', 'Murrindindi', 'Baw Baw', 'Cardinia'],
  },

  // --- Queensland: 12 + 1 hinterland ---
  {
    slug: 'brisbane-inner',
    name: 'Inner Brisbane',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Brisbane'],
  },
  {
    slug: 'brisbane-north',
    name: 'Brisbane North',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Brisbane'],
  },
  {
    slug: 'brisbane-east',
    name: 'Brisbane East',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Brisbane'],
  },
  {
    slug: 'brisbane-south',
    name: 'Brisbane South',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Brisbane'],
  },
  {
    slug: 'brisbane-west',
    name: 'Brisbane West',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Brisbane'],
  },
  { slug: 'ipswich', name: 'Ipswich', state: 'QLD', ruralFringe: false, councils: ['Ipswich'] },
  { slug: 'logan', name: 'Logan', state: 'QLD', ruralFringe: false, councils: ['Logan'] },
  { slug: 'redlands', name: 'Redlands', state: 'QLD', ruralFringe: false, councils: ['Redland'] },
  {
    slug: 'moreton-bay',
    name: 'Moreton Bay',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Moreton Bay'],
  },
  {
    slug: 'sunshine-coast',
    name: 'Sunshine Coast',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Sunshine Coast'],
  },
  { slug: 'noosa', name: 'Noosa', state: 'QLD', ruralFringe: false, councils: ['Noosa'] },
  {
    slug: 'gold-coast',
    name: 'Gold Coast',
    state: 'QLD',
    ruralFringe: false,
    councils: ['Gold Coast'],
  },
  {
    slug: 'seq-hinterland',
    name: 'South East Queensland Hinterland',
    state: 'QLD',
    ruralFringe: true,
    councils: ['Scenic Rim', 'Gympie', 'Somerset'],
  },
] as const;

const bySlug = new Map(REGIONS.map((r) => [r.slug, r]));

function region(slug: string): RegionDef {
  const found = bySlug.get(slug);
  if (!found) throw new Error(`Unknown region slug: ${slug}`);
  return found;
}

/**
 * Region for one locality. Geographic first, council second.
 *
 * Order matters: the fringe check runs before the council lookup, because
 * Yarra Ranges and Cardinia appear in two regions each and only the fringe
 * flag distinguishes them.
 */
export function resolveRegion(args: {
  council: string;
  locality: string;
  state: StateKey;
  coords: Coords;
}): RegionDef {
  const { council, locality, state, coords } = args;

  if (isRuralFringe(council, locality)) {
    return region(state === 'VIC' ? 'yarra-valley-and-hinterland' : 'seq-hinterland');
  }
  if (council === 'Brisbane') return region(brisbaneSubRegion(coords));

  const match = REGIONS.find(
    (r) => r.state === state && !r.ruralFringe && r.councils.includes(council),
  );
  if (!match) {
    throw new Error(
      `unmapped council "${council}" (locality ${locality}, ${state}). ` +
        `Add it to lib/locations/regions.ts REGIONS rather than defaulting it.`,
    );
  }
  return match;
}
