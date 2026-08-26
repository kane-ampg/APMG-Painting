/**
 * Turn the Australian locality dataset into content/locations.generated.json.
 *
 * The output is committed. Builds are deterministic and offline, CI never
 * depends on a third-party dataset being reachable, and regenerating produces
 * a reviewable diff rather than a silent change.
 *
 * USAGE
 *   npm run locations:build            # uses the cached download if present
 *   npm run locations:build -- --fetch # re-download first
 *
 * This script FAILS rather than degrading. A council that suddenly contributes
 * one locality, or a total that moves off the verified count, is a data
 * problem that must be looked at — not something to absorb quietly.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nearestAnchor } from '../lib/geo/anchors';
import { distanceKm } from '../lib/geo/haversine';
import {
  IMPOSSIBLE_COUNCILS,
  SINGLE_LOCALITY_COUNCIL_ALLOWLIST,
  isRuralFringe,
  resolveRegion,
} from '../lib/locations/regions';
import type { GeneratedLocality, StateKey } from '../lib/locations/types';

const SOURCE_URL =
  'https://raw.githubusercontent.com/matthewproctor/australianpostcodes/master/australian_postcodes.json';
const CACHE = resolve('.cache/australian_postcodes.json');
const OUT = resolve('content/locations.generated.json');
/**
 * Verified against the dataset on 2026-08-24 under the filters below,
 * including deduping on state+slug (collapsing the BRISBANE CITY /
 * BRISBANE-CITY and curly-/straight-apostrophe O'REILLY spelling variants)
 * and dropping 87 postal/institutional non-suburb artifacts (task-6-ruling-2.md):
 * 1,527 − 87 = 1,440.
 * Not a target: if the pipeline stops matching this, the build fails so a
 * human looks at the diff. Changing this number is a decision, not a fix.
 */
/**
 * 2026-08-26: 1,440 -> 1,387. Deliberate, not drift.
 *
 * The whole-branch review found that the BC/DC/MC sweep had missed 53 more
 * Australia Post artifacts of the same class — post offices, street-address
 * delivery rows, shopping centres, RAAF bases, the wholesale markets, an
 * immigration detention centre — and that they were rendering as suburbs on
 * indexable region hubs and in the Tier 1 nearby-suburb lists. See
 * NON_SUBURB_PATTERNS below for the rules and
 * .superpowers/sdd/2026-08-25-areas-vic-qld/final-fix-report.md for the full
 * list of names removed. 1,440 - 53 = 1,387.
 */
const EXPECTED_TOTAL = 1387;
const NEIGHBOUR_COUNT = 6;

/**
 * Delivery areas that are not suburbs.
 *
 * The dataset's RA_2021_NAME column is not usable as a gate — it tags Port of
 * Brisbane and the whole Wynnum industrial corridor "Remote Australia" while
 * passing genuine farmland. These are excluded by name because a university
 * campus or a shopping centre is not a locality someone searches for a painter
 * in, not because of any column.
 */
const NON_SUBURB_LOCALITIES = new Set([
  'BRISBANE AIRPORT',
  'WORLD TRADE CENTRE',
  'UNIVERSITY OF MELBOURNE',
  'ROYAL MELBOURNE HOSPITAL',
  'LA TROBE UNIVERSITY',
  'MONASH UNIVERSITY',
  'DEAKIN UNIVERSITY',
  'ROBINA TOWN CENTRE',
  'WYNNUM PLAZA',
  'NORTH POLE',
  'NJATJAN',
  // task-6-ruling-2.md: 8 more institutional delivery areas found alongside
  // the BC/DC/MC postal-artifact sweep below.
  'GRIFFITH UNIVERSITY',
  'MATER HOSPITAL',
  'PRINCESS ALEXANDRA HOSPITAL',
  'SUNSHINE PLAZA',
  'LALOR PLAZA',
  'MELBOURNE AIRPORT',
  'MELBOURNE UNIVERSITY',
  'MOORABBIN AIRPORT',
  // 2026-08-26 sweep. Same class again: retail, wholesale, port, aged-care and
  // civic delivery names that no pattern can catch without also catching a real
  // suburb. Each was checked individually against the dataset and against the
  // real locality it sits inside, which survives in every case.
  //
  // The five "... CITY" names are Australia Post names for shopping centres
  // (Ashmore City, Westfield Garden City, Highpoint, Stafford City, Westfield
  // Strathpine). There is deliberately NO / CITY$/ pattern: BRISBANE CITY is
  // the CBD locality, a real suburb, and would be destroyed by one.
  'ASHMORE CITY',
  'GARDEN CITY',
  'HIGHPOINT CITY',
  'STAFFORD CITY',
  'STRATHPINE CITY',
  // Retail centres and postal outlets whose names end in a word that is
  // legitimate elsewhere. / CENTRAL$/ would take Hamilton Central, Logan
  // Central, Springfield Central, Wynnum Central and Kinglake Central, all
  // real; / GARDENS$/ would take Aspendale Gardens, Cypress Gardens and
  // Florida Gardens, all real. So these five are named, not patterned.
  'BOX HILL CENTRAL',
  'FAIRFIELD GARDENS',
  'VICTORIA GARDENS',
  'WAVERLEY GARDENS',
  'HOPETOUN GARDENS',
  // Wholesale markets, the showgrounds, the port, an aged-care home, a
  // repatriation hospital and Parliament House. None is a locality.
  'BRISBANE MARKET',
  'BRISBANE EXHIBITION',
  'PORT OF BRISBANE',
  'BRIGHTON EVENTIDE',
  'HEIDELBERG RGH',
  'PARLIAMENT HOUSE',
]);

/**
 * Postal Business Centre / Delivery Centre / Mail Centre artifacts — not
 * suburbs, just Australia Post bulk-delivery addresses (`ACACIA RIDGE BC`,
 * `GOLD COAST MC`, `NERANG BC`). 79 of these were each generating their own
 * suburb page (task-6-ruling-2.md, problem 1) — 5.7% of the site, the worst
 * content-quality defect in the dataset. The real suburb behind each
 * artifact (Nerang, Southport, Maroochydore, Epping, Deepdene, South
 * Melbourne, Acacia Ridge, Eagle Farm, Albion, Bundall, Yatala, Robina,
 * Virginia, ...) has its own separate, non-matching row and survives.
 * `AIRPORT WEST` is a real Melbourne suburb and does not match this pattern.
 */
const NON_SUBURB_SUFFIX = /\b(BC|DC|MC)$/;

/**
 * The rest of the artifact class, as patterns rather than a hand list.
 *
 * The BC/DC/MC sweep above caught the bulk-delivery rows and stopped. It left
 * behind the same class of thing under Australia Post's other naming
 * conventions, and those rows were reaching *indexable* pages:
 * /areas/victoria/eastern/ listed "Bedford Road", "Brentford Square", "Knox
 * City Centre" and "Tunstall Square Po" as suburbs, and the Tier 1 page for
 * Vermont linked "Brentford Square" as a nearby suburb. A rater sampling those
 * hubs sees postal outlets and a detention centre presented as localities,
 * which is the doorway signal the whole tiering scheme exists to avoid.
 *
 * Patterns, not names, wherever the pattern is unambiguous: a new artifact
 * appearing upstream is then filtered on arrival instead of waiting for
 * someone to notice it. Every rule below was run against the full VIC/QLD
 * delivery-area set and the complete list of names it removes was reviewed by
 * hand; that list is recorded in
 * .superpowers/sdd/2026-08-25-areas-vic-qld/final-fix-report.md.
 *
 * Rules CONSIDERED AND REJECTED, because the dataset proved them unsafe:
 *   / CITY$/     takes BRISBANE CITY, the CBD locality.
 *   / CENTRAL$/  takes HAMILTON CENTRAL, LOGAN CENTRAL, SPRINGFIELD CENTRAL,
 *                WYNNUM CENTRAL, KINGLAKE CENTRAL.
 *   / GARDENS$/  takes ASPENDALE GARDENS, CYPRESS GARDENS, FLORIDA GARDENS.
 *   / TERRACE$/  takes PETRIE TERRACE.
 * Those cases are handled by name in NON_SUBURB_LOCALITIES instead.
 *
 * AIRPORT WEST matches none of these and survives, as do BROADMEADOWS and
 * BROADBEACH — the street-type rule is word-anchored, so the "ROAD" inside
 * "bROADmeadows" is not a match.
 */
const NON_SUBURB_PATTERNS: readonly RegExp[] = [
  // Post office / delivery facility suffixes: BOORAN ROAD PO, HEATHWOOD DF,
  // BRISBANE GPO. No VIC/QLD locality ends in a bare PO, GPO, LPO or DF.
  / (PO|GPO|LPO|DF)$/,
  // Spelled-out postal outlets: HEALESVILLE POST SHOP, MARSDEN POSTAL DEPOT.
  /\b(POST SHOP|POSTAL DEPOT|POST OFFICE)\b/,
  // Shopping centres and one immigration detention centre: CHADSTONE CENTRE,
  // KNOX CITY CENTRE, HELENSVALE TOWN CENTRE, WACOL EAST IMMIGRATION CENTRE,
  // Q SUPERCENTRE. No locality in either state ends in CENTRE.
  / (SUPER)?CENTRE$/,
  // Shopping centres named "... Fair": AUSTRALIA FAIR, PACIFIC FAIR, BOOVAL
  // FAIR. A suburb that merely contains "fair" (FAIRFIELD, FAIRNEY VIEW) does
  // not match, because the rule needs FAIR as the final word.
  / FAIR$/,
  // Street-address delivery rows: BEDFORD ROAD, NORTH ROAD, BRENTFORD SQUARE,
  // ST KILDA ROAD CENTRAL, CHAPEL STREET NORTH, WYNNUM PLAZA. A street type
  // anywhere in the name, not only at the end, so a trailing compass direction
  // on the postal variants does not let them through.
  /\b(ROAD|STREET|SQUARE|PLAZA)\b/,
  // RAAF bases: LAVERTON RAAF, WILLIAMS RAAF. Same class as the university and
  // hospital delivery areas already excluded by name.
  / RAAF$/,
];

/**
 * Councils the dataset gets wrong or omits, keyed by postcode.
 *
 * 4007 (Ascot, Doomben, Hamilton, Hamilton Central, Whinstanes) has no
 * `lgaregion` at all. 4178 (Wynnum and the Lytton industrial corridor) is
 * tagged Redland; it is Brisbane City, and lib/locations/regions.ts's own
 * test fixture asserts Wynnum resolves to Brisbane — leaving it as Redland
 * would contradict a passing test. 4183 (Dunwich, North Stradbroke Island,
 * −27.50/153.40) is tagged Gold Coast, which is ~100km away; Dunwich is
 * Redland City. Same class of upstream corruption as the other two — a
 * large legitimate council name that happens to be wrong for this specific
 * postcode, so no council-count gate catches it.
 */
const COUNCIL_OVERRIDES_BY_POSTCODE: Record<string, string> = {
  '4007': 'Brisbane',
  '4178': 'Brisbane',
  '4183': 'Redland',
};

/**
 * Councils the dataset gets wrong, keyed by locality name — task-6-ruling-2.md,
 * problem 2. `lgaregion` is wrong for roughly 7% of localities; `lgacode`
 * mirrors it (same bad data) and `sa3name` is right in some of these cases
 * and wrong in others, so no column in the dataset is a reliable source of
 * truth. Nearest-neighbour smoothing was tried and rejected: it fixed Carrara
 * and Gaven but missed Nerang and Highland Park, and proposed reassignments
 * in the wrong direction elsewhere, because bad assignments cluster and the
 * voting neighbours are themselves wrong.
 *
 * This list is not a general lgaregion cleanup. It is scoped to the subset
 * with structural consequences: a real, commercially active suburb tagged to
 * a wholly-fringe council is flagged rural fringe, filed into the
 * hinterland/farmland region hub, cut out of neighbour links, and made
 * permanently un-promotable. scripts/audit-councils.mjs is the
 * centroid-outlier check that surfaced these; it is committed so residual,
 * not-yet-hand-checked errors stay visible rather than silently wrong.
 */
const COUNCIL_OVERRIDES_BY_LOCALITY: Record<string, string> = {
  // Gold Coast City, currently tagged Scenic Rim. Scenic Rim is wholly
  // fringe, so all eleven were filed as farmland — Nerang and Carrara are
  // major commercial centres. Tamborine Mountain, North Tamborine, Mount
  // Tamborine and Lower Beechmont are genuinely Scenic Rim/rural and are
  // deliberately left alone.
  ADVANCETOWN: 'Gold Coast',
  CARRARA: 'Gold Coast',
  CLAGIRABA: 'Gold Coast',
  GAVEN: 'Gold Coast',
  GILSTON: 'Gold Coast',
  'HIGHLAND PARK': 'Gold Coast',
  LATIMER: 'Gold Coast',
  'MOUNT NATHAN': 'Gold Coast',
  NERANG: 'Gold Coast',
  'PACIFIC PINES': 'Gold Coast',
  'PINDARI HILLS': 'Gold Coast',

  // Yarra Ranges Shire, currently tagged Murrindindi / Nillumbik / Cardinia.
  HEALESVILLE: 'Yarra Ranges',
  'YARRA GLEN': 'Yarra Ranges',
  SEVILLE: 'Yarra Ranges',
  'WANDIN EAST': 'Yarra Ranges',
  'WANDIN NORTH': 'Yarra Ranges',
  'WOORI YALLOCK': 'Yarra Ranges',

  // Cardinia Shire, currently tagged Baw Baw / Yarra Ranges.
  'KOO WEE RUP': 'Cardinia',
  EMERALD: 'Cardinia',

  // Noosa Shire, currently tagged Gympie.
  COOROY: 'Noosa',
  TINBEERWAH: 'Noosa',
  'LAKE MACDONALD': 'Noosa',

  // Sunshine Coast, currently tagged Gympie.
  KENILWORTH: 'Sunshine Coast',
};

/**
 * Tier 1 seed list (spec §7). VIC only: Queensland cannot carry a Tier 1 page
 * while qldPresence is false, because Tier 1 implies local evidence.
 */
const TIER_1_VIC = new Set([
  'BAYSWATER',
  'DANDENONG SOUTH',
  'NOTTING HILL',
  'PORT MELBOURNE',
  'CLAYTON',
  'BRAESIDE',
  'TULLAMARINE',
  'LAVERTON NORTH',
  'CAMPBELLFIELD',
  'VERMONT',
  'CHIRNSIDE PARK',
  'RINGWOOD',
  'BOX HILL',
  'RICHMOND',
  'SOUTH MELBOURNE',
]);

type Row = {
  locality?: string;
  state?: string;
  postcode?: string;
  type?: string;
  lat?: number;
  long?: number;
  Lat_precise?: number;
  Long_precise?: number;
  lgaregion?: string;
};

/** Full state name as it appears in the `/areas/{state}/...` URL path. */
const STATE_PATH: Record<StateKey, string> = {
  VIC: 'victoria',
  QLD: 'queensland',
};

function localityHref(l: { state: StateKey; regionSlug: string; slug: string }): string {
  return `/areas/${STATE_PATH[l.state]}/${l.regionSlug}/${l.slug}/`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Same-state spelling-variant pairs (e.g. `BRISBANE CITY` / `BRISBANE-CITY`,
 * or a curly vs. straight apostrophe in `O'REILLY`) dedupe onto one record.
 * Pick a deterministic canonical display name: prefer more spaces in the raw
 * name (a hyphen standing in for a space reads worse), then prefer the
 * ASCII-only variant (a straight apostrophe over a curly one), then keep
 * whichever was encountered first.
 */
function isAsciiOnly(name: string): boolean {
  return /^[\x00-\x7F]*$/.test(name);
}

function spaceCount(name: string): number {
  return (name.match(/ /g) ?? []).length;
}

function preferredName(existing: string, candidate: string): string {
  const bySpaces = spaceCount(candidate) - spaceCount(existing);
  if (bySpaces !== 0) return bySpaces > 0 ? candidate : existing;
  const existingAscii = isAsciiOnly(existing);
  const candidateAscii = isAsciiOnly(candidate);
  if (existingAscii !== candidateAscii) return candidateAscii ? candidate : existing;
  return existing;
}

async function loadSource(): Promise<Row[]> {
  const wantsFetch = process.argv.includes('--fetch');
  if (wantsFetch || !existsSync(CACHE)) {
    process.stdout.write(`Downloading ${SOURCE_URL}\n`);
    const res = await fetch(SOURCE_URL);
    if (!res.ok) throw new Error(`Source fetch failed: HTTP ${res.status}`);
    mkdirSync(resolve('.cache'), { recursive: true });
    writeFileSync(CACHE, await res.text());
  }
  return JSON.parse(readFileSync(CACHE, 'utf8')) as Row[];
}

function fail(message: string): never {
  process.stderr.write(`\nGENERATOR FAILED\n  ${message}\n\n`);
  process.exit(1);
}

const rows = await loadSource();

// --- filter and dedupe -----------------------------------------------------
type Candidate = {
  name: string;
  state: StateKey;
  postcodes: Set<string>;
  lat: number;
  lng: number;
  council: string;
};

const candidates = new Map<string, Candidate>();

for (const r of rows) {
  if (r.type !== 'Delivery Area') continue;
  if (r.state !== 'VIC' && r.state !== 'QLD') continue;
  if (!r.locality) continue;
  const name = r.locality.toUpperCase();
  if (NON_SUBURB_LOCALITIES.has(name)) continue;
  if (NON_SUBURB_SUFFIX.test(name)) continue;
  if (NON_SUBURB_PATTERNS.some((pattern) => pattern.test(name))) continue;

  const council =
    COUNCIL_OVERRIDES_BY_LOCALITY[name] ??
    (r.postcode ? COUNCIL_OVERRIDES_BY_POSTCODE[r.postcode] : undefined) ??
    r.lgaregion;
  if (!council) continue;
  if (IMPOSSIBLE_COUNCILS.includes(council)) continue;

  const lat = r.Lat_precise ?? r.lat;
  const lng = r.Long_precise ?? r.long;
  if (typeof lat !== 'number' || typeof lng !== 'number') continue;

  // Dedupe on state + slugified locality, not the raw string: spelling
  // variants of the same place (a hyphen for a space, a curly apostrophe)
  // must collapse to one record rather than surviving as two candidates
  // that later collide on slug.
  const key = `${r.state}|${slugify(r.locality)}`;
  const existing = candidates.get(key);
  if (existing) {
    if (r.postcode) existing.postcodes.add(r.postcode);
    existing.name = preferredName(existing.name, r.locality);
    continue;
  }
  candidates.set(key, {
    name: r.locality,
    state: r.state,
    postcodes: new Set(r.postcode ? [r.postcode] : []),
    lat,
    lng,
    council,
  });
}

// --- radius and nearest-anchor assignment ----------------------------------
const inRadius: Array<Candidate & { anchorKey: string; distanceKm: number }> = [];

for (const c of candidates.values()) {
  const match = nearestAnchor({ lat: c.lat, lng: c.lng }, c.state);
  if (!match) continue;
  inRadius.push({ ...c, anchorKey: match.anchor.key, distanceKm: match.distanceKm });
}

// --- sanity check: fail loudly on suspicious councils ----------------------
const councilCounts = new Map<string, number>();
for (const c of inRadius) councilCounts.set(c.council, (councilCounts.get(c.council) ?? 0) + 1);

const suspicious = [...councilCounts.entries()]
  .filter(([council, n]) => n <= 2 && !SINGLE_LOCALITY_COUNCIL_ALLOWLIST.includes(council))
  .map(([council, n]) => `${council} (${n})`);

if (suspicious.length > 0) {
  fail(
    `These councils contribute <= 2 localities and are not allowlisted:\n    ` +
      suspicious.join('\n    ') +
      `\n\n  Either they are bad coordinates (drop them via IMPOSSIBLE_COUNCILS)\n` +
      `  or they are legitimate edge cases (add to SINGLE_LOCALITY_COUNCIL_ALLOWLIST).\n` +
      `  Both are human decisions. This script will not guess.`,
  );
}

// --- region, fringe, tier --------------------------------------------------
const localities: GeneratedLocality[] = inRadius.map((c) => {
  const coords = { lat: c.lat, lng: c.lng };
  const ruralFringe = isRuralFringe(c.council, c.name);
  const region = resolveRegion({
    council: c.council,
    locality: c.name,
    state: c.state,
    coords,
  });
  const tier: 1 | 3 =
    !ruralFringe && c.state === 'VIC' && TIER_1_VIC.has(c.name.toUpperCase()) ? 1 : 3;

  return {
    slug: slugify(c.name),
    name: c.name,
    state: c.state,
    postcodes: [...c.postcodes].sort(),
    coords,
    council: c.council,
    anchorKey: c.anchorKey,
    distanceKm: Number(c.distanceKm.toFixed(2)),
    regionSlug: region.slug,
    ruralFringe,
    tier,
    neighbourHrefs: [],
  };
});

// --- URL collisions ----------------------------------------------------
// The URL is /areas/{state}/{region}/{suburb}/, already namespaced by
// state and region — so the uniqueness guard belongs on that composite key,
// not on the bare slug. A bare-slug check would fail on every legitimate
// cross-state name reuse (Victoria's Brighton, Queensland's Brighton), which
// is expected and not a collision at all.
const urlCounts = new Map<string, string[]>();
for (const l of localities) {
  const key = `${l.state}|${l.regionSlug}|${l.slug}`;
  urlCounts.set(key, [...(urlCounts.get(key) ?? []), `${l.name} ${l.state}`]);
}
const collisions = [...urlCounts.entries()].filter(([, names]) => names.length > 1);
if (collisions.length > 0) {
  fail(
    `URL collisions:\n    ` +
      collisions.map(([key, names]) => `${key}: ${names.join(', ')}`).join('\n    '),
  );
}

// --- neighbours ------------------------------------------------------------
// Non-fringe only, on both sides: a fringe locality is not a useful internal
// link target, and linking into farmland from a commercial page dilutes both.
//
// Full hrefs, not bare slugs: a bare slug is ambiguous across states (both
// Victoria and Queensland have a Brighton), so a consumer doing a naive
// find-by-slug could silently link a Melbourne page to a Queensland suburb.
// A full `/areas/{state}/{region}/{suburb}/` href can't be misresolved.
const linkable = localities.filter((l) => !l.ruralFringe);
for (const l of linkable) {
  l.neighbourHrefs = linkable
    .filter((o) => o.slug !== l.slug && o.state === l.state)
    .map((o) => ({ href: localityHref(o), d: distanceKm(l.coords, o.coords) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, NEIGHBOUR_COUNT)
    .map((o) => o.href);
}

// --- total check -----------------------------------------------------------
if (localities.length !== EXPECTED_TOTAL) {
  fail(
    `Expected ${EXPECTED_TOTAL} localities, got ${localities.length}.\n` +
      `  The upstream dataset has changed. Review the diff, confirm it is\n` +
      `  correct, then update EXPECTED_TOTAL here and in the test.`,
  );
}

localities.sort((a, b) => a.state.localeCompare(b.state) || a.slug.localeCompare(b.slug));

writeFileSync(OUT, JSON.stringify({ generatedFrom: SOURCE_URL, localities }, null, 2) + '\n');

process.stdout.write(
  `Wrote ${localities.length} localities to ${OUT}\n` +
    `  Tier 1: ${localities.filter((l) => l.tier === 1).length}\n` +
    `  Rural fringe: ${localities.filter((l) => l.ruralFringe).length}\n` +
    `  Councils: ${new Set(localities.map((l) => l.council)).size}\n`,
);
