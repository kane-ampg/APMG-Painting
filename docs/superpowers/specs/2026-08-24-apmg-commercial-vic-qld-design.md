# APMG Commercial (VIC + QLD) — Design

**Date:** 2026-08-24
**Status:** Approved, pending implementation plan
**Supersedes:** nothing. This is a third site, built alongside `APMG Painting v2`.

---

## 1. Purpose

Build a commercial-painting-only website for APMG Painting covering Victoria and South East Queensland, as a non-indexable sandbox preview. It is the third APMG site:

| # | Site | Status |
|---|---|---|
| 1 | `apmgpainting.com.au` (WordPress) | Live. Commercial + residential, Melbourne only. |
| 2 | `APMG Painting v2` | Sandbox preview. Commercial + residential, Melbourne only. Stays as-is for comparison. |
| 3 | **This build** | Sandbox preview. **Commercial only**, VIC + QLD. |

The site must not be launched, indexed, or linked to from anywhere until APMG explicitly approves it.

## 2. Goals

1. Commercial painting only. No residential pages, copy, or navigation.
2. Two service states: Victoria, and Queensland (Brisbane, Sunshine Coast, Gold Coast).
3. A suburb page for every locality inside the specified radii — 1,516 of them.
4. Materially better SEO than site 1, without incurring scaled-content or doorway-page risk.
5. Truthful throughout. No claim the business cannot evidence.

## 3. Non-goals

- **Sector × suburb pages.** 8 sectors × 1,516 suburbs = 12,128 pages. This is the fastest way to get a trade site algorithmically suppressed. Not built, not in phase 2, not ever at suburb granularity.
- **Any residential surface.** No house painting, no interior-decor copy, no homeowner FAQs.
- **Non-painting trades.** Plastering, rendering as a standalone service, repairs, line marking. Painting and painting-preparation only.
- **Claiming a Queensland presence.** See §9.
- **Going live.** Out of scope for this build entirely.

## 4. Decisions taken

| Decision | Choice | Rationale |
|---|---|---|
| Suburb architecture | Tiered hub-and-spoke | Full coverage without doorway risk |
| Repo | New repo, new sandbox domain | Site 2 survives as comparison |
| QLD status | Expansion play — no address, no projects, no phone | Honesty; determines schema and indexability |
| Scope | Painting strictly only; residential deleted | Client brief |
| Sector pages | All 8 retained | The commercial service spine |
| Brand | "APMG Painting", unchanged | Single config value if it changes |
| URLs | Nested by state → region → suburb | Explicit hierarchy; clean future VIC/QLD split |
| Design | Reuse v2 design system, re-pitched at B2B | v2 system is sound; saves a rebuild |

## 5. Radius anchors and locality set

Source: `matthewproctor/australianpostcodes` (18,559 records, includes `lat`/`long`, `Lat_precise`/`Long_precise`, `lgaregion`, `postcode`, `type`).

Filter chain:

1. `type === "Delivery Area"` (drops PO boxes and LVR records)
2. `state ∈ {VIC, QLD}`
3. Deduplicate on `state|locality`, keeping the first record; prefer `Lat_precise`/`Long_precise` over `lat`/`long`
4. Haversine distance ≤ the anchor radius
5. Assign to the **nearest** anchor, so no locality gets two URLs
6. Drop `RA_2021_NAME ∈ {Remote Australia, Outer Regional Australia, ""}`
7. **Coordinate sanity check** — see §5.1

| Anchor | Coordinates | Radius | Localities |
|---|---|---|---|
| Bayswater North VIC 3153 | −37.845116, 145.270141 | 50 km | 622 |
| Brisbane CBD QLD 4000 | −27.4698, 153.0251 | 40 km | 547 |
| Southport QLD 4215 | −27.9680, 153.4000 | 40 km | 181 |
| Maroochydore QLD 4558 | −26.6600, 153.0930 | 40 km | 166 |
| **Total** | | | **1,516** |

### 5.1 Known bad data — must be filtered

`sa3name` / `sa4name` are corrupted for a subset of rows. The dataset labels Ipswich-area suburbs "Wide Bay" and a Brisbane locality "Cairns". **These columns are not used anywhere.** Region grouping uses `lgaregion` plus geography.

Four councils contribute exactly one locality each to the Victorian set. Two are geographically impossible and two are legitimate edge cases:

| Council | Verdict |
|---|---|
| Surf Coast | **Impossible.** ~90 km from Bayswater North. Name collision or bad coordinates. Drop. |
| South Gippsland | **Impossible.** ~90 km away. Drop. |
| Melton | **Legitimate.** Melton's eastern edge (Hillside) genuinely falls just inside 50 km. Allowlist. |
| Mitchell | **Legitimate.** Southern tip only. Allowlist. |

**Rule:** the generator fails the build if any council contributes ≤ 2 localities and is not on an explicit allowlist. This turns a silent data error into a build error. The allowlist holds `Melton` and `Mitchell`, is reviewed by a human, and is never auto-populated.

### 5.2 Rural fringe

Several councils inside the radii are farmland with no commercial building stock worth targeting. Counts below are **whole-council totals inside the radius**, not the fringe subset:

| Council | Localities in radius | Anchor | Fringe rule |
|---|---|---|---|
| Scenic Rim | 95 | Brisbane + Gold Coast | Entire council |
| Cardinia | 44 | Bayswater North | Split — see below |
| Yarra Ranges | 39 | Bayswater North | Split — see below |
| Nillumbik | 37 | Bayswater North | Entire council |
| Gympie | 14 | Maroochydore | Entire council |
| Murrindindi | 8 | Bayswater North | Entire council |
| Baw Baw | 4 | Bayswater North | Entire council |
| Somerset | 2 | Maroochydore | Entire council |

**Split rule for Cardinia and Yarra Ranges.** Both councils straddle the urban growth boundary — Pakenham and Officer are genuine commercial centres; Gembrook and Powelltown are not. A whole-council flag would be wrong in both directions.

A locality in these two councils is `ruralFringe: false` only if it appears on an explicit **urban allowlist**, authored once and committed:

- **Cardinia urban:** Pakenham, Pakenham Upper, Officer, Officer South, Beaconsfield, Beaconsfield Upper, Bunyip, Koo Wee Rup, Lang Lang, Emerald, Cockatoo
- **Yarra Ranges urban:** Lilydale, Mooroolbark, Chirnside Park, Montrose, Kilsyth South, Healesville, Yarra Glen, Seville, Wandin North, Woori Yallock, Belgrave, Upwey, Tecoma, Ferny Creek, Olinda

Everything else in those two councils is fringe. Chirnside Park is on the list because it is APMG's own base.

Fringe suburbs carry `ruralFringe: true`. They:

- Still get a page (the brief says every suburb in the radius)
- Are **permanently Tier 3** — not promotable to indexable
- Are grouped into a single hinterland region hub per state rather than getting a region hub each
- Are excluded from "nearby suburbs" internal links on non-fringe pages

## 6. Information architecture

```
/                                       home
/commercial-painting/                   pillar page
/services/interior-painting/
/services/exterior-painting/
/services/office-painting/
/services/protective-coatings/
/services/builders-and-head-contractors/
/sectors/education-and-childcare/
/sectors/healthcare/
/sectors/aged-care/
/sectors/body-corporate-and-strata/
/sectors/retail/
/sectors/hospitality/
/sectors/leisure-and-sports/
/sectors/industrial-and-warehouse/
/projects/                              case study index
/projects/{slug}/
/locations/                             national hub
/locations/victoria/
/locations/victoria/{region}/
/locations/victoria/{region}/{suburb}/
/locations/queensland/
/locations/queensland/{region}/
/locations/queensland/{region}/{suburb}/
/about/
/contact/
```

`/services/property-maintenance/` from site 2 is narrowed to **painting maintenance programmes** and folded into `/services/builders-and-head-contractors/`. `/trade-services/` is renamed `/services/builders-and-head-contractors/` — it is B2B painting, not residential.

### 6.1 Region model — 22 hubs

Region assignment is **geographic first, council second**. Councils that are small and coherent map directly; councils too large to be a region are split by bearing and distance from their anchor.

**Victoria (8 + 1 hinterland)**

| Region | Councils |
|---|---|
| Inner Melbourne | Melbourne, Port Phillip, Yarra |
| Inner East | Boroondara, Stonnington |
| Eastern | Whitehorse, Manningham, Maroondah, Knox, Yarra Ranges (urban) |
| South East | Monash, Greater Dandenong, Casey, Cardinia (urban) |
| Bayside & Peninsula | Bayside, Glen Eira, Kingston, Frankston, Mornington Peninsula |
| Northern | Darebin, Banyule, Whittlesea, Moreland |
| North West | Hume, Moonee Valley, Melton |
| Western | Brimbank, Maribyrnong, Hobsons Bay, Wyndham |
| *Yarra Valley & Hinterland* | Yarra Ranges (rural), Nillumbik, Murrindindi, Baw Baw, Cardinia (rural) — `ruralFringe` |

**Queensland (12 + 1 hinterland)**

Brisbane City Council is 307 localities in one LGA, so it splits geographically into five regions by bearing from the CBD:

| Region | Basis |
|---|---|
| Brisbane Inner | Brisbane CC, ≤ 5 km from CBD |
| Brisbane North | Brisbane CC, bearing 315°–45° |
| Brisbane East | Brisbane CC, bearing 45°–135° |
| Brisbane South | Brisbane CC, bearing 135°–225° |
| Brisbane West | Brisbane CC, bearing 225°–315° |
| Ipswich | Ipswich |
| Logan | Logan |
| Redlands | Redland |
| Moreton Bay | Moreton Bay |
| Sunshine Coast | Sunshine Coast |
| Noosa | Noosa |
| Gold Coast | Gold Coast |
| *SEQ Hinterland* | Scenic Rim, Gympie, Somerset — `ruralFringe` |

Gold Coast at 132 localities is large but geographically coherent and is one region. If its hub page proves unwieldy in build it splits North/Central/South on the same bearing rule; the generator supports this without a schema change.

## 7. Indexability tiers

This is the mechanism that makes 1,516 pages safe.

| Tier | Count | In sitemap | `robots` | Content |
|---|---|---|---|---|
| Region hub | 22 | ✅ | index,follow | 800–1,200 words, hand-written |
| Tier 1 suburb | ~50 | ✅ | index,follow | Hand-written, unique |
| Tier 3 suburb | ~1,466 | ❌ | noindex,follow | Data-differentiated template |

**Tier 1 criteria** — a suburb qualifies on either:

- APMG has a documented project in it, **or**
- it is a recognised commercial or industrial precinct with real search demand

Seed Tier 1 list (VIC): Bayswater, Dandenong South, Notting Hill, Port Melbourne, Clayton, Braeside, Tullamarine, Laverton North, Campbellfield, Vermont, Chirnside Park, Ringwood, Box Hill, Richmond, South Melbourne.
(QLD): Eagle Farm, Murarrie, Rocklea, Darra, Yatala, Molendinar, Burleigh Heads, Kunda Park, Warana, Northgate, Wacol, Archerfield.

QLD Tier 1 entries are indexable on the strength of **sector and service** content, never on a claim of local presence. See §9.

`noindex,follow` rather than `noindex,nofollow` is deliberate: the page passes no indexing signal but still lets crawlers traverse to the region hub and sector pages it links to.

**Promotion** is a single field change in the generated data, reviewed by a human. No page auto-promotes.

While `NEXT_PUBLIC_SANDBOX` is not `"false"`, all of the above is overridden and every page is `noindex, nofollow`. Tiers govern what happens *at launch*, not what happens now.

## 8. Per-suburb differentiation

Every suburb page, including Tier 3, carries six facts that are true only of that suburb. No name-swapped template.

| Field | Source |
|---|---|
| Council | `lgaregion`, plus a hand-authored permit/heritage note per council |
| Distance & drive band from base | Computed haversine, bucketed (`<20 min`, `20–40 min`, `40–60 min`, `60 min+`) |
| Nearest documented APMG project | Computed against project coordinates, with its distance |
| Dominant commercial building stock | Authored once per council, inherited by its suburbs |
| Six nearest suburbs | Computed geographically; excludes rural-fringe from non-fringe pages |
| Postcode(s) | Dataset |

Council-level notes are authored once for **49 councils**, not 1,516 times. That is the leverage that makes real differentiation affordable.

### 8.1 Generation pipeline

`scripts/build-locations.mjs`:

```
au-postcodes.json  →  filter  →  dedupe  →  radius  →  nearest-anchor
                   →  quality filter  →  sanity check (fails build)
                   →  region assign  →  tier assign  →  neighbours
                   →  content/locations.generated.json  (committed)
```

The output is **committed to the repo**. Builds are deterministic and offline; CI never depends on a third-party dataset being up. Regenerating is an explicit, reviewable diff.

Hand-authored content lives in separate files keyed by slug (`content/locations.overrides.ts`, `content/councils.ts`) and is merged at build. The generator never overwrites human-written copy.

## 9. Queensland — the honesty constraint

APMG has no Queensland address, no completed Queensland projects, and no Queensland phone number. Therefore:

- **No second `LocalBusiness` entity.** One `LocalBusiness` for Chirnside Park. QLD is expressed as `areaServed`, nothing more.
- **No Queensland Google Business Profile.** Cannot be created without an address. QLD map-pack visibility is unavailable and the client brief says so.
- **Copy discipline.** QLD pages say "we service" and never "we're based in", "our Brisbane team", or "local to the Gold Coast".
- **All QLD suburb pages are Tier 3** until a project or address exists.
- **QLD region hubs are indexable** on the strength of genuine service and sector content — what the work involves, how it is scoped and sequenced — which is true regardless of where it is performed.

`content/locations.overrides.ts` carries a `qldPresence` flag. When APMG supplies an address or a project, flipping it activates the second `LocalBusiness`, the QLD contact block, and QLD Tier 1 eligibility.

## 10. Structured data

| Schema | Where | Notes |
|---|---|---|
| `Organization` | Sitewide | `legalName`, `sameAs`, `foundingDate: 2015` |
| `LocalBusiness` | Sitewide | Chirnside Park only. `geo` omitted until coordinates confirmed |
| `areaServed` | `LocalBusiness` | `GeoCircle` for the VIC radius; `AdministrativeArea` entries for the three QLD regions |
| `Service` | Service + sector pages | `serviceType`, `provider`, `areaServed` |
| `BreadcrumbList` | All nested pages | Falls out of the URL hierarchy |
| `FAQPage` | Sector pages | Sector-specific questions only |
| `AggregateRating` | **Not emitted** | No first-party verified reviews. Emitting a third-party widget's aggregate is a documented route to a manual penalty |

Carried from site 2: nothing is emitted for an unverified accreditation.

## 11. Sandbox lockdown

Four independent layers, so no single mistake exposes the site.

1. `NEXT_PUBLIC_SANDBOX` defaults to **on**. Live requires explicitly setting it to the string `"false"`.
2. `robots.txt` returns `User-agent: * / Disallow: /`, no sitemap reference.
3. `<meta name="robots" content="noindex, nofollow">` on every page.
4. **`X-Robots-Tag: noindex, nofollow` response header.** It is the only layer that covers non-HTML responses — images, the OG image route, `llms.txt`, any PDF.

   Site 2 already sets this in `next.config.ts` `headers()`, but **unconditionally**. That is worse than not having it: at go-live, setting `NEXT_PUBLIC_SANDBOX="false"` would switch off layers 2 and 3 while this header kept returning `noindex` — and a header-level `noindex` overrides everything. The site would be launched and permanently unindexable, with no visible symptom on the page itself.

   This build makes the header conditional on the same `isSandbox` value as the other three layers, so all four switch together. A test asserts the header is **absent** when `NEXT_PUBLIC_SANDBOX="false"`.

Plus, operationally: Vercel deployment protection on, sitemap never submitted to Search Console, and no external link pointed at the preview.

A test asserts all four layers are active when `NEXT_PUBLIC_SANDBOX` is unset, and that `sitemap.xml` contains no `noindex` URL when it is `"false"`.

## 12. SEO improvements over site 1

Site 1's `/robots.txt` and every sitemap endpoint return HTTP 500, so Google currently receives no directives at all.

| Area | Site 1 | This build |
|---|---|---|
| robots.txt | HTTP 500 | Valid, AI crawlers named explicitly |
| Sitemap | HTTP 500 | Valid; indexable URLs only; real `lastModified` |
| Suburb pages | 68, all thin, 3 defective | 1,516, tiered, differentiated |
| H1 correctness | "Painters Painters Armadale", "Painting Brighton" | Generated from structured data |
| Internal linking | Suburb pages orphaned | Suburb → region → state → sector matrix |
| Structured data | Inconsistent | Typed, evidence-gated |
| Business name | Rendered 4 ways + one typo ("AMPG") | Single source in `lib/site.ts` |
| Go-live switch | n/a | All four noindex layers keyed to one value, tested in both states |
| Service area claim | "throughout Australia" once | Explicit, evidenced |
| `llms.txt` | Absent | Present, extended to the region model |

## 13. Content inventory

**Carried over from site 2:** design system and Tailwind tokens, UI components, enquiry forms and validation, schema helpers, metadata builder, `lib/site.ts`, 8 sector pages (re-pitched at facilities managers), 4 commercial case studies, about, contact, `llms.txt`, quote chat (behind a flag).

**Deleted:** `/residential-painting/`, residential nav column, residential FAQs, the Glen Iris residential case study, `audience: 'residential'` throughout, the `Audience` type's `'residential'` member.

**New:** the locality generator and its data, 22 region hubs, 1,516 suburb pages, `content/councils.ts` (49 entries), the QLD state hub, middleware `X-Robots-Tag`, the sanity-check build gate.

## 14. Testing

| Level | Coverage |
|---|---|
| Unit | Haversine, nearest-anchor assignment, region rules, bearing split, tier assignment, slug generation, neighbour selection |
| Data | Every locality has exactly one URL; no duplicate slugs; every suburb resolves to a real region; sanity check fires on a seeded bad record |
| Schema | Valid JSON-LD; no `AggregateRating`; no second `LocalBusiness` while `qldPresence` is false |
| Sandbox | All four lockdown layers active when `NEXT_PUBLIC_SANDBOX` is unset; **all four absent when it is `"false"`**; sitemap excludes noindex URLs |
| Copy | No QLD page contains "based in", "our Brisbane", "local to" |
| E2E | Suburb → region → state → sector navigation; enquiry form; 404 |
| Build | 1,516 static pages generate; build time recorded |

The copy test is unusual but load-bearing: §9 is the constraint most likely to be violated by a later well-meaning edit, and a lint rule catches it where a review would not.

## 15. Risks

| Risk | Mitigation |
|---|---|
| 1,516 pages read as a doorway network | Tier 3 is noindex and absent from the sitemap. Google sees ~72 pages |
| Build time at 1,516 static pages | Measure early. If unacceptable, Tier 3 moves to on-demand ISR — they are noindex and low-traffic, so this costs nothing |
| Source dataset is third-party and imperfect | Output committed; sanity check fails the build; corrupt `sa4name` columns unused |
| QLD honesty erodes over time | Automated copy test, plus a single `qldPresence` flag as the only switch |
| Tier 3 never gets promoted | Client brief lists exactly what promotes a page. `indexabilityReason` recorded per suburb |

## 16. What APMG must supply

Carried from `docs/CLIENT-BRIEF.md` and extended:

1. Google Business Profile claimed and maintained — the largest single lever
2. Reviews with reproduction permission — activates the review section and star ratings
3. Six accreditation certificates — activates trust indicators sitewide
4. Chirnside Park coordinates — activates `GeoCircle` in `areaServed`
5. ABN
6. Sector photography — 8 sector pages have no image
7. **Queensland:** an address, a project, or both. Until then QLD cannot rank locally
8. Commercial precinct confirmation for the Tier 1 seed list
9. Search Console access, to sort suburb tiers on data rather than judgement

## 17. Phasing

| Phase | Scope |
|---|---|
| 1 | Scaffold from site 2, strip residential, `X-Robots-Tag` middleware, sandbox tests |
| 2 | Locality generator, data, sanity check, 49 council notes |
| 3 | Location templates: national → state → region → suburb |
| 4 | Sector and service pages re-pitched at B2B; internal linking matrix |
| 5 | Tier 1 hand-written content, schema, `llms.txt`, full test suite |
| 6 | 8 sectors × 22 regions = 176 pages. **Only after 1–5 ship and are reviewed** |

Phase 6 is deliberately last and deliberately optional.
