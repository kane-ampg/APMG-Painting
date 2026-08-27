# APMG Painting — `/areas/` expanded to VIC + South East Queensland

**Date:** 2026-08-25
**Status:** Implemented 2026-08-26. See the revision note below.
**Repo:** `APMG-Painting` (site 2)
**Related:** `docs/superpowers/specs/2026-08-24-apmg-commercial-vic-qld-design.md` — the site 3 design this build ports its locality subsystem from

---

## Revision — 2026-08-26

Implemented. Two things moved from the figures below and are corrected throughout.

**The locality total is 1,387, not 1,440.** The final whole-branch review found ~53 non-suburb
rows surviving the generator's artifact filter — post offices (`TUNSTALL SQUARE PO`), delivery
facilities (`HEATHWOOD DF`), shopping centres (`CHADSTONE CENTRE`, `PACIFIC FAIR`),
street-address delivery rows (`BEDFORD ROAD`, `BRENTFORD SQUARE`) and one detention centre
(`WACOL EAST IMMIGRATION CENTRE`). They were rendering as suburb pages and, worse, being listed
as suburbs on the **indexable** region hubs — the exact doorway signal §7 exists to prevent,
on the 41 pages that are actually indexed. Six pattern rules replaced the hand list. Four
further candidate rules were tested and rejected because each destroyed a real locality
(`/ CITY$/` → Brisbane City; `/ CENTRAL$/` → Springfield/Wynnum/Logan/Hamilton/Kinglake Central;
`/ GARDENS$/` → Aspendale/Florida/Cypress Gardens; `/ TERRACE$/` → Petrie Terrace); the
rejections are documented in the generator and pinned by a test.

**41 indexable pages is unchanged.** None of the 53 was a Tier 1 entry or a redirect target, so
the tiering figures move only in the Tier 3 denominator.

Derived: 1,412 pages (was 1,465), Tier 3 1,371 (was 1,424), VIC 583 / QLD 804 (was 612 / 828),
fringe 207 (was 209), anchors 583/482/167/155 (was 612/501/172/155).

---

## 1. Purpose

Add `Areas` to the main navigation and expand `/areas/` from 7 flat suburb pages to
the full locality set inside four service radii: 1,387 suburbs across Victoria and
South East Queensland, arranged state → region → suburb, with indexability tiered so
that scale does not read as a doorway network.

The request was "include all suburbs within 50km from Bayswater North in Victoria and
40km radius from Brisbane city, Sunshine Coast and Gold Coast city", plus "make sure
they rank high in Google SEO". §11 is explicit about which half of that second ask
this build can deliver and which half only APMG can.

## 2. Decisions taken

Confirmed with the client before design:

| Decision     | Choice                                            | Rejected alternative                                                                   |
| ------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Repo         | This one (`APMG-Painting`), not `APMG-Commercial` | Site 3 already has an equivalent build; this one now ships                             |
| URL base     | `/areas/` retained                                | Renaming to `/locations/` — rejected, moves indexed URLs for no gain                   |
| URL shape    | Nested `state → region → suburb`                  | Flat `/areas/painters-{suburb}/` — see §4.1, it cannot hold the set                    |
| Indexability | Tiered                                            | Index all 1,387 — see §7                                                               |
| Data         | Port the generator from site 3                    | Copy generated JSON (unregenerable); rewrite from scratch (re-earns every data defect) |

## 3. Non-goals

- **Sector × suburb pages.** 8 sectors × 1,387 suburbs = 11,096 pages. Not built, not
  in a later phase, not ever at suburb granularity.
- ~~**Going live.** The sandbox stays locked down (§10). This build does not launch.~~
  **Superseded 2026-08-26** — the site went live in commit `7d7129f`, which removed all four
  noindex layers deliberately. §10.1 is now history rather than active guidance: the defect it
  describes was fixed first, so the four layers released together as designed rather than
  leaving a header-level `noindex` behind.
- **A Queensland presence.** See §9.
- **Re-sorting the 68 legacy suburb pages on traffic data.** `scripts/sort-legacy-suburbs.mjs`
  already exists for that and needs a Search Console export APMG has not supplied.
  Unaffected by this work: every legacy path gets a redirect either way (§5).

## 4. Information architecture

```
/areas/                                     national hub
/areas/victoria/                            state hub
/areas/victoria/{region}/                   region hub      (8 + 1 hinterland)
/areas/victoria/{region}/{suburb}/          suburb
/areas/queensland/                          state hub
/areas/queensland/{region}/                 region hub      (12 + 1 hinterland)
/areas/queensland/{region}/{suburb}/        suburb
```

1,387 suburbs + 22 region hubs + 2 state hubs + 1 national hub = **1,412 pages**.

### 4.1 Why nesting is forced, not preferred

Two independent reasons, either sufficient:

1. **Slug collisions.** 13 locality names exist in both states — Albion, Brighton,
   Burnside, Clifton Hill, Donnybrook, Fairfield, Gilberton, Heathwood, Middle Park,
   Newport, Sumner, Windsor, Wishart. A flat namespace resolves 1,387 localities to
   1,374 slugs. `painters-brighton` already exists in this repo for Brighton VIC, which
   carries a real documented project; a flat scheme would either overwrite it or need
   ad-hoc state suffixes on an arbitrary 13.
2. **Next.js routing.** `app/areas/[slug]/` and `app/areas/[state]/` cannot be siblings —
   two different dynamic segment names at one level is a build error. Adding the state
   tier therefore _requires_ deleting `app/areas/[slug]/`.

The hub layer is also the point: 1,387 leaves hanging directly off one index page is the
weakest possible internal-link shape. Region hubs are what make the set crawlable and
what give each suburb page somewhere to pass equity to.

### 4.2 Region model — 22 hubs

Geographic first, council second. Ported verbatim from site 3 §6.1. Brisbane City
Council is 307 localities in one LGA, so it splits into five regions by bearing from the
CBD (Inner ≤5km, then North 315°–45°, East 45°–135°, South 135°–225°, West 225°–315°).

**Victoria (8 + 1):** Inner Melbourne 38, Inner East 36, Eastern 73, South East 61,
Bayside & Peninsula 90, Northern 76, North West 32, Western 71, _Yarra Valley &
Hinterland 106 (fringe)_. Sums to 583.

**Queensland (12 + 1):** Brisbane Inner 60, Brisbane North 51, Brisbane East 39,
Brisbane South 79, Brisbane West 40, Ipswich 31, Logan 49, Redlands 20, Moreton Bay 73,
Sunshine Coast 97, Noosa 29, Gold Coast 135, _SEQ Hinterland 101 (fringe)_. Sums to 804.

## 5. Legacy URLs

Every live WordPress suburb page is `/areas/painters-{suburb}/`. Only 7 of the 68 carry a
`legacyPath` in this repo, so a hand-written redirect list would silently miss ~61 indexed
URLs.

Instead `next.config.ts` **generates** the redirect table from
`content/locations.generated.json`: for each locality, `/areas/painters-{slug}/` → its
nested href. All 68 legacy pages are Melbourne suburbs inside the 50km radius, so this
covers the set by construction rather than by someone remembering to add a line. The 3
existing defect corrections are kept and chained ahead of it:

| Legacy                         | Reason                    |
| ------------------------------ | ------------------------- |
| `/areas/painters-park-dale/`   | Duplicate of `parkdale`   |
| `/areas/painters-travencore/`  | Misspelling of Travancore |
| `/areas/painters-garden-vale/` | Misspelling of Gardenvale |

`next.config.ts` redirects are evaluated before routing, so a legacy path never reaches
`app/areas/[state]/`.

## 6. Data pipeline

```
au-postcodes.json → filter → dedupe → radius → nearest-anchor → quality filter
                  → sanity check (FAILS BUILD) → region assign → tier assign
                  → neighbours → content/locations.generated.json (committed)
```

Ported from site 3, retargeted from `/locations/` to `/areas/`:

| Path                             | Lines | Contents                                                         |
| -------------------------------- | ----- | ---------------------------------------------------------------- |
| `scripts/build-locations.mts`    | ~440  | The pipeline, plus the data-defect rules below                   |
| `lib/geo/haversine.ts`           | 25    | Distance                                                         |
| `lib/geo/anchors.ts`             | 67    | The four anchors; nearest-in-state-and-radius assignment         |
| `lib/locations/types.ts`         | 45    | `GeneratedLocality`, `RegionDef`, `Tier`                         |
| `lib/locations/regions.ts`       | 288   | 22 region definitions, bearing split, fringe and allowlist rules |
| `lib/locations/index.ts`         | 107   | Merge layer; `href` retargeted to `/areas/…`                     |
| `content/councils.ts`            | 353   | 45 hand-authored council notes                                   |
| `content/locations.overrides.ts` | 24    | Hand-written per-suburb copy; `qldPresence` flag                 |

The output is **committed**. Builds are deterministic and offline; CI never depends on a
third-party dataset being reachable; regenerating produces a reviewable diff. Run with
`npm run locations:build` (`-- --fetch` to re-download).

### 6.1 Anchors

Used verbatim. Do not round.

| Anchor          | Coordinates            | Radius | Localities |
| --------------- | ---------------------- | ------ | ---------- |
| Bayswater North | −37.845116, 145.270141 | 50 km  | 583        |
| Brisbane CBD    | −27.4698, 153.0251     | 40 km  | 482        |
| Southport       | −27.9680, 153.4000     | 40 km  | 167        |
| Maroochydore    | −26.6600, 153.0930     | 40 km  | 155        |

Assignment is nearest-anchor **within the same state**, so overlapping radii (Brisbane
and Southport are 66.6km apart with 40km radii, meaning 35 localities in the Logan/Beenleigh
corridor fall inside both) still yield exactly one URL per locality, and no border locality
is pulled across the state line.

### 6.2 Why the generator is ported rather than rewritten

It carries data cleanup that is expensive to rediscover and invisible when absent:

- **79 Australia Post artifacts.** `ACACIA RIDGE BC`, `GOLD COAST MC`, `NERANG BC` are
  bulk-delivery addresses, not suburbs. Each was generating its own page — 5.7% of the
  site. The real suburb behind each has a separate surviving row.
- **20 institutional delivery areas.** Brisbane Airport, Monash University, Royal
  Melbourne Hospital, Robina Town Centre. Nobody searches for a painter in a hospital
  campus. Excluded by name, because the dataset's `RA_2021_NAME` column is not usable as
  a gate — it tags the Wynnum industrial corridor "Remote Australia" while passing
  genuine farmland.
- **Corrupted `lgaregion` on ~7% of rows**, with `lgacode` mirroring the same bad data and
  `sa3name`/`sa4name` worse (Ipswich suburbs labelled "Wide Bay", a Brisbane locality
  labelled "Cairns"). No column is reliable. Nearest-neighbour smoothing was tried and
  rejected — bad assignments cluster, so the voting neighbours are themselves wrong.
  Corrections are an explicit scoped list.
- **3 postcode-level council overrides.** 4007 has no `lgaregion` at all; 4178 (Wynnum)
  is tagged Redland but is Brisbane City; 4183 (Dunwich) is tagged Gold Coast, ~100km away.
- **Coordinate sanity check.** Surf Coast and South Gippsland each contribute one
  locality ~90km from Bayswater North — impossible, dropped. Melton and Mitchell each
  contribute one legitimately and are allowlisted.

### 6.3 The build gate

The generator **fails** rather than degrading:

- Total ≠ 1,387 → build error. Changing this number is a decision, not a fix.
- Any council contributing ≤2 localities and not on `SINGLE_LOCALITY_COUNCIL_ALLOWLIST`
  (`Melton`, `Mitchell`, `Somerset` — human-reviewed, never auto-populated) → build error.

  Somerset is on the list for a different reason than the other two and the difference is worth
  keeping. Melton and Mitchell each contribute a single locality because only the very edge of
  the council falls inside the radius, which is exactly the shape a coordinate error also takes —
  hence the gate. Somerset contributes two, legitimately: it is a rural-fringe council whose
  in-radius portion is genuinely that small (§7.3). Verified against the generated data —
  Melton 1, Mitchell 1, Somerset 2, and no other council sits at or below the threshold.

- A locality whose council has no note in `content/councils.ts` → throws at import.

This turns a silent data regression into a red build.

## 7. Indexability

The mechanism that makes 1,412 pages safe.

| Tier          | Count | Sitemap | robots         | Content                       |
| ------------- | ----- | ------- | -------------- | ----------------------------- |
| National hub  | 1     | ✅      | index,follow   | Directory                     |
| State hub     | 2     | ✅      | index,follow   | Hand-written                  |
| Region hub    | 22    | ✅      | index,follow   | 800–1,200 words, hand-written |
| Tier 1 suburb | 16    | ✅      | index,follow   | Hand-written, unique          |
| Tier 3 suburb | 1,371 | ❌      | noindex,follow | Data-differentiated (§8)      |

**41 indexable pages, not 1,387.** Google sees a small strong site with a large
crawlable substrate beneath it.

`noindex,follow` rather than `noindex,nofollow` is deliberate: the page passes no
indexing signal but crawlers still traverse from it to the region hub and sector pages.

Tier 3 pages are **excluded from the sitemap**. Listing a `noindex` URL in a sitemap
sends Google two contradictory instructions.

Indexability is **computed at read time from `tier`, never stored** in the generated
JSON. Storing it would let it drift from `tier` the first time someone hand-edited one
and not the other. One rule, in `lib/locations/index.ts`:

```
indexable = tier === 1 && !ruralFringe && (state === 'VIC' || qldPresence)
```

### 7.1 Correction to the tier count

The site 3 spec projected "~50 Tier 1" suburbs and I repeated a resulting "~72 indexable"
figure during design. **The actual generated data yields 16, and 41 indexable pages
total.** The gap is not a defect — the seed list in that spec was aspirational, pending
two inputs APMG has not supplied (§11 items 4 and 5). Recorded here so the number in the
repo is the real one.

Current Tier 1 (all VIC): Bayswater, Box Hill, Braeside, Campbellfield, Chirnside Park,
Clayton, Dandenong South, Laverton North, Notting Hill, Port Melbourne, Richmond,
Ringwood, South Melbourne, Tullamarine, Vermont.

### 7.2 Bayswater North must be promoted

The ported data has **Bayswater North at Tier 3** — noindex. It is APMG's own registered
office. The site 3 spec's own §7 says it "leads the list because it is APMG's own base",
so this is a defect in the generated output, not a judgement call: the one suburb where
the business is physically located would be the one suburb it could not rank in.

Promoted to Tier 1 in this build, bringing Tier 1 to **16** and total indexable to **41**.

### 7.3 Rural fringe

207 localities across Scenic Rim, Nillumbik, Murrindindi, Baw Baw, Gympie, Somerset and
the rural parts of Cardinia and Yarra Ranges are farmland with no commercial building
stock worth targeting. They:

- Still get a page (the brief says every suburb in the radius)
- Are **permanently Tier 3** — not promotable
- Group into one hinterland hub per state rather than a region hub each
- Are excluded from "nearby suburbs" links on non-fringe pages

Cardinia and Yarra Ranges straddle the urban growth boundary — Pakenham and Officer are
genuine commercial centres, Gembrook and Powelltown are not — so those two councils use
an explicit committed urban allowlist rather than a whole-council flag, which would be
wrong in both directions.

### 7.4 Promotion

A single field change in the generated data, reviewed by a human. No page auto-promotes.
`indexabilityReason` is recorded per suburb so the client can review each call.

## 8. Per-suburb differentiation

Every suburb page, Tier 3 included, carries six facts true only of that suburb. This is
what separates the build from a name-swapped template.

| Field                             | Source                                                             |
| --------------------------------- | ------------------------------------------------------------------ |
| Council + building stock + note   | Hand-authored once per council (45), inherited by its suburbs      |
| Distance and drive band from base | Computed haversine, bucketed `<20 min` / `20–40` / `40–60` / `60+` |
| Nearest documented APMG project   | Computed against project coordinates, with its distance            |
| Six nearest suburbs               | Computed geographically; fringe excluded from non-fringe pages     |
| Postcode(s)                       | Dataset                                                            |
| Region and state                  | Assigned (§4.2)                                                    |

45 pieces of real writing carry 1,387 pages. That is the leverage that makes genuine
differentiation affordable.

Neighbour links are stored as **full hrefs, not bare slugs** — a bare slug is ambiguous
across states, and a consumer doing `find(l => l.slug === s)` would silently resolve to
the wrong state's locality.

Dataset names arrive upper-case (`CHIRNSIDE PARK`, `MCKINNON`). `displayName()` in
`lib/locations/index.ts` is the single place they are title-cased, so the `Mc` rule is
only right once.

## 9. Queensland — the honesty constraint

APMG has no Queensland address, no completed Queensland projects, and no Queensland phone
number. Therefore:

- **One `LocalBusiness`,** Bayswater North. QLD is `areaServed`, nothing more.
- **No Queensland Google Business Profile.** Cannot be created without an address.
  QLD map-pack visibility is unavailable and this build says so rather than implying
  otherwise.
- **Copy discipline.** QLD pages say "we service". Never "based in", "our Brisbane team",
  or "local to the Gold Coast".
- **All 804 QLD suburbs are Tier 3** while `qldPresence === false`.
- **QLD region hubs stay indexable** on genuine service and sector content — what the
  work involves, how it is scoped and sequenced — which is true regardless of where it
  is performed.

`qldPresence` in `content/locations.overrides.ts` is the single switch. Flipping it
activates the second `LocalBusiness`, the QLD contact block, and QLD Tier 1 eligibility.

The QLD Tier 1 seed list from site 3 §7 (Eagle Farm, Murarrie, Rocklea, Darra, Yatala,
Molendinar, Burleigh Heads, Kunda Park, Warana, Northgate, Wacol, Archerfield) is
correctly inert: all 12 generate at Tier 3, and `computeIndexable` gates them a second
time. Belt and braces, deliberately.

## 10. SEO

### 10.1 The `X-Robots-Tag` bug — highest-value fix in this build

`next.config.ts` currently sets `X-Robots-Tag: noindex, nofollow` on `/:path*`
**unconditionally**. The other three sandbox layers key off `isSandbox`.

At go-live, setting `NEXT_PUBLIC_SANDBOX="false"` would switch off the meta tag and the
`robots.txt` disallow while this header kept returning `noindex` — and a header-level
`noindex` overrides everything. The site would be launched, fully lockdown-released, and
permanently unindexable, with **no visible symptom on the page itself**.

Made conditional on the same `isSandbox` value as the other three, so all four switch
together. Tested in both states: all four present when `NEXT_PUBLIC_SANDBOX` is unset,
all four **absent** when it is `"false"`.

This is worth more than every other item in this section combined, because it is the
difference between the site ranking and the site being invisible.

### 10.2 Structured data

| Schema            | Where            | Notes                                                                                                    |
| ----------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `BreadcrumbList`  | All nested pages | Falls out of the URL hierarchy                                                                           |
| `areaServed`      | `LocalBusiness`  | `GeoCircle` for VIC; `AdministrativeArea` for the three QLD regions                                      |
| `LocalBusiness`   | Sitewide         | Bayswater North only. `geo` omitted until coordinates confirmed                                          |
| `Service`         | Sector pages     | `serviceType`, `provider`, `areaServed`                                                                  |
| `AggregateRating` | **Not emitted**  | No first-party verified reviews. Emitting a widget's aggregate is a documented route to a manual penalty |

Nothing is emitted for an unverified accreditation.

### 10.3 Sitemap

Indexable URLs only. Region and state hubs at 0.7, Tier 1 suburbs at 0.8 — above project
case studies, because "painters &lt;suburb&gt;" is the query APMG can realistically win and
every URL in that list has already passed an evidence test the rest of the sitemap does
not apply. `lastModified` stays a build-date floor rather than `new Date()` on every URL;
a `lastmod` that is always "now" is one Google learns to ignore.

### 10.4 Internal linking

Suburb → region hub → state hub → `/areas/`, plus suburb → nearest documented project,
suburb → six nearest suburbs, and region hub → sector pages. This is what turns 1,371
`noindex,follow` pages from dead weight into a crawl substrate that feeds the 41 indexable
ones.

The live site's suburb pages are orphaned — reachable from nothing.

### 10.5 Breadcrumbs sit at the top of the page

The trail is the primary wayfinding cue on a four-level hierarchy
(`Home / Areas / Victoria / Eastern / Vermont`), so its position is load-bearing here in a
way it is not on a flat site.

The repo currently places it two different ways:

| Placement                       | Pages                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| Top, above the H1 — **correct** | `/areas/`, `/areas/{slug}/`, `/projects/`, `/projects/{slug}/`, `/about-us/`, `/contact-us/` |
| Below the `<Hero>` — **wrong**  | `/commercial/`, `/{sector}/`, `/office-painters/`, `/trade-services/`                        |

Below a full-bleed hero the trail is off-screen on a phone and reads as a caption to the
hero rather than as navigation. Standardised: **breadcrumbs render directly under the
header, before the `<Hero>` or header `<Section>`, on every page that has them.**

All four location levels use it, so `/areas/victoria/eastern/vermont/` opens with its
full ancestry visible without scrolling. The `BreadcrumbList` JSON-LD is emitted from the
same `crumbs` array by the same component, so the visible trail and the structured data
cannot disagree — moving the trail does not touch the markup.

Fixed ahead of the location work rather than alongside it, so the new pages inherit a
settled pattern instead of copying whichever neighbour they were written next to.

### 10.6 Other

- `Areas` in `mainNav`, and an `areas` column in the footer. `DesktopNav` and
  `MobileMenu` are already data-driven off `mainNav` and need no changes.
- `llms.txt` extended to the region model.
- One H1 per page, generated from structured data. The live site renders
  "Painters Painters Armadale" and "Painting Brighton".
- Correct meta description on every page — `buildMetadata` already makes it a required
  argument, so a page without one does not compile.

## 11. What only APMG can supply

This build gets the technical and architectural side right. These matter more for local
trade rankings and none of them can be built:

1. **Google Business Profile** claimed and repointed to Bayswater North. It is still
   registered to Chirnside Park, so the site and the profile currently disagree on the
   one fact the map pack cares most about. Largest single lever available.
2. **Reviews with reproduction permission** — activates the review section and
   `AggregateRating`.
3. **Geocoded street address** for 1 Turbo Drive — the street address, not the suburb
   centroid — activates `GeoCircle` in `areaServed` and `geo` on `LocalBusiness`.
4. **Commercial precinct confirmation** for the Tier 1 list (§7.1).
5. **Search Console access**, to sort suburb tiers on data rather than judgement.
6. **Queensland: an address, a project, or both.** Until then QLD cannot rank locally.
   No address, no map pack, no way around it.
7. ABN; sector photography; six accreditation certificates of currency.

## 12. Testing

| Level    | Coverage                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit     | Haversine, nearest-anchor, region rules, bearing split, tier assignment, slug generation, neighbour selection, `displayName`                                        |
| Data     | Every locality has exactly one URL; no duplicate hrefs; every suburb resolves to a real region; every council has a note; sanity check fires on a seeded bad record |
| Tiers    | 41 indexable; Bayswater North is Tier 1; no QLD locality indexable while `qldPresence` is false; no fringe locality indexable                                       |
| Redirect | Every generated legacy `/areas/painters-{slug}/` resolves to a real nested page; the 3 defect corrections still work                                                |
| Schema   | Valid JSON-LD; no `AggregateRating`; exactly one `LocalBusiness`                                                                                                    |
| Sandbox  | All four lockdown layers active when `NEXT_PUBLIC_SANDBOX` unset; **all four absent when `"false"`**; sitemap contains no noindex URL                               |
| Copy     | No QLD page contains "based in", "our Brisbane", "local to"                                                                                                         |
| E2E      | Suburb → region → state → sector navigation; `Areas` nav on desktop and mobile; enquiry form; 404                                                                   |
| Build    | 1,412 static pages generate; build time recorded                                                                                                                    |

The copy test is unusual but load-bearing: §9 is the constraint most likely to be broken
by a later well-meaning edit, and a lint rule catches it where a review will not.

## 13. Risks

| Risk                                    | Mitigation                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1,412 pages read as a doorway network   | Tier 3 is noindex and absent from the sitemap. Google sees 41 pages                                          |
| Build time at 1,412 static pages        | Measure early. If unacceptable, Tier 3 moves to on-demand ISR — noindex and low-traffic, so it costs nothing |
| Third-party dataset is imperfect        | Output committed; sanity check fails the build; corrupt columns unused; defect rules documented in §6.2      |
| QLD honesty erodes over time            | Automated copy test, plus `qldPresence` as the single switch                                                 |
| Tier 3 never gets promoted              | §11 lists exactly what promotes a page; `indexabilityReason` recorded per suburb                             |
| This repo and `APMG-Commercial` diverge | Accepted. The client chose this repo to ship; site 3 is no longer the target of new work                     |

## 14. Phasing

| Phase | Scope                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------ |
| 1     | Port `lib/geo/`, `lib/locations/`, `content/councils.ts`; generator; committed data; unit + data tests |
| 2     | `X-Robots-Tag` conditional fix + sandbox tests in both states                                          |
| 3     | Breadcrumbs standardised to the top of every page (§10.5) — 4 pages move                               |
| 4     | Routes: national → state → region → suburb; delete `app/areas/[slug]/`; generated redirects            |
| 5     | `Areas` in `mainNav` and footer; internal linking matrix                                               |
| 6     | Bayswater North promotion; region hub copy; schema; sitemap; `llms.txt`; full test suite               |

Phases 2 and 3 are deliberately early and independent of the rest. Phase 2 is a live
launch-blocking defect, not part of this feature. Phase 3 lands before the new routes so
they inherit a settled pattern rather than copying whichever neighbour they sat next to.

---

## Addendum — 2026-08-27 SEO audit changes

Figures above that say **16 Tier 1 / 41 indexable / 1,371 Tier 3** are now
**17 / 42 / 1,370**: Brighton VIC was promoted to Tier 1 on the evidence rule
itself (hand-written intro + the documented Newbay Medical project). Five
Tier 1 councils were corrected in the generator's override table (Bayswater →
Knox, Ringwood → Maroondah, Vermont → Whitehorse, Dandenong South → Greater
Dandenong, Port Melbourne → Port Phillip), pinned by
tests/unit/tier1-councils.test.ts. Sector pages now follow the same evidence
rule as the tiers: no documented project → noindex,follow and out of the
sitemap (app/[sector]/page.tsx + app/sitemap.ts, same predicate). §10.3's
`lastModified` build-date floor is also superseded: the sitemap now emits no
lastmod at all — no content model carries a real modification date yet, and a
build-date on every URL is a claim Google learns to ignore.
