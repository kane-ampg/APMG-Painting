# Project status — 10 September 2026

> **Update, later on 10 September 2026:** the integration described below is done. `f379252` was
> replayed onto local `master` as `2aeac68`: the live design (Contact masthead, "How a job runs"
> rail, `/areas/` VIC + QLD) + the CMS + the 9–10 September work, verified with typecheck, lint,
> 519 unit tests, a 1,443-page production build and 63 Playwright tests. `master` is 44 commits
> ahead of GitHub and not pushed. The main folder was left on `feature/headless-cms` because this
> document and the README edit were uncommitted there; `feature/cms-page-editor` still needs
> rebasing onto `master`. The scratch merge worktrees and `integrate/design` are gone. The branch
> map below is the pre-merge state.

Where every piece of work on this site is, which branch holds it, what has reached GitHub, and what
is still in flight. Written from the git history and the Claude Code session transcripts for this
folder, so the reasoning behind each decision is recorded alongside the code it produced.

Read this before touching a branch. Nothing is lost, but no single branch currently has everything.

---

## TL;DR

- **GitHub master** (`kane-ampg/APMG-Painting`) stops at `48e6295` "Huge Update", 27 August. It
  has the VIC + QLD `/areas/` locality layer, the "How a job runs" homepage section and the released
  noindex lockdown. It has none of the CMS and none of the 9–10 September design work.
- **`feature/headless-cms`** (`f379252`, pushed) has the whole CMS plus everything from 9–10
  September: the free site assessment CTA and booking form, the brand-guide typography and
  statements, the trade services redesign, the animation polish and the admin's local preview mode.
  It was built on the 24 August codebase, so it is missing the 25–27 August `/areas/` expansion.
- **Local `master`** (`7e784e7`, not pushed) is the CMS replayed on top of GitHub master, so it has
  the areas work and the CMS. It does not have the 9–10 September commit.
- **`feature/cms-page-editor`** (worktree `.worktrees/page-editor`) is the page-by-page editor
  for Farbod and Zac, being built by a background agent as this was written. Uncommitted.
- **`integrate/design`** and three scratch worktrees are a half-finished attempt to combine the two
  histories. Conflicts were unresolved when this was written.
- `Desktop\APMG-Painting` is a second, stale clone at GitHub master. GitHub Desktop was pointed at
  it, which is why the work looked missing. The real work is in `Desktop\APMG Painting v2`.

---

## 1. Branch map

| Branch                    | Head      | Built on                 | Has                                                                               | Missing                                             | On GitHub?            |
| ------------------------- | --------- | ------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------- |
| `origin/master`           | `48e6295` | —                        | Areas layer, "How a job runs", released noindex, breadcrumbs at top               | CMS, all 9–10 Sep work                              | Yes (this is GitHub)  |
| `master` (local)          | `7e784e7` | `origin/master`          | Everything above + the CMS (41 commits replayed) + 3 reconcile commits + dev fix  | 9–10 Sep commit `f379252`                           | No — 43 commits ahead |
| `feature/headless-cms`    | `f379252` | `25c9c15` (24 Aug)       | CMS + 9–10 Sep work (site assessment, brand, trade services, preview mode)        | 25–27 Aug areas layer, "How a job runs", 65 commits | Yes, up to date       |
| `feature/cms-page-editor` | `8dabbfa` | `1a9055a` (headless-cms) | Local preview mode + page-editor spec; ~18 uncommitted files from the build agent | `f379252` and everything master has                 | No                    |
| `integrate/design`        | `f379252` | `feature/headless-cms`   | Identical to headless-cms; the integration was to land here                       | —                                                   | No                    |

Counts, from `git rev-list`:

| Comparison                                   | Commits |
| -------------------------------------------- | ------- |
| `feature/headless-cms` not in local `master` | 42      |
| local `master` not in `feature/headless-cms` | 65      |
| local `master` not in `origin/master`        | 43      |

The 42 and the 41 replayed commits are the same CMS work with different SHAs, which is why a plain
merge of the two produces conflicts in every CMS file rather than a clean result.

### Worktrees

| Path                                               | Branch / commit                      | Purpose                                                   |
| -------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| `Desktop\APMG Painting v2`                         | `feature/headless-cms`               | Main working tree. Dev server on port 3001.               |
| `Desktop\APMG Painting v2\.worktrees\page-editor`  | `feature/cms-page-editor`            | Page editor build. Dev server on port 3002.               |
| `%TEMP%\claude\...\db479964-...\scratchpad\mergeA` | `integrate/design`                   | Merge attempt A, conflicted (`.gitignore`, README, pages) |
| `%TEMP%\claude\...\db479964-...\scratchpad\mergeB` | detached at `7e784e7` (local master) | Merge attempt B, conflicted                               |
| `%TEMP%\claude\...\db479964-...\scratchpad\mergeC` | detached at `f379252`                | Merge attempt C, conflicted                               |

The three scratch worktrees belong to the session that was resolving the tangle. Do not delete them
until that session has finished or been abandoned; `git worktree list` shows them.

---

## 2. How the tangle happened

1. **23–24 August.** The site was rebuilt as a Next.js preview and pushed to a new GitHub repo.
   Two clones ended up on the Desktop: `APMG Painting v2` (where the work happens) and
   `APMG-Painting` (what GitHub Desktop opened). This was noticed on 24 August and both were
   brought level, but the second clone was never removed.
2. **25–27 August.** The `/areas/` VIC + QLD locality expansion, the "How a job runs" section and
   the go-live noindex removal were committed on `master` and pushed. GitHub master has been static
   since `48e6295` on 27 August.
3. **8 September.** CMS work began on `feature/headless-cms`, branched from the 24 August favicon
   commit rather than from the 27 August master. Forty commits followed over 8–9 September.
4. **9 September.** A session replayed the CMS commits onto GitHub master to produce local `master`
   (`3c5ab97`, `601f87e`, `e208455` are the reconcile commits). It was not pushed. The same day, on
   `feature/headless-cms`, three sessions ran in parallel: the brand guide pass, the free site
   assessment CTA, and the trade services page redesign. Each left its work uncommitted on purpose
   because the others were active in the same folder.
5. **10 September, early.** The dev-server `/admin` fix landed on both histories (`1a9055a` and its
   cherry-pick `7e784e7`). A local preview mode for the admin was added, uncommitted. The user then
   committed all 65 modified files on `feature/headless-cms` as `f379252` "Update Headless CMS",
   which is why one commit carries five sessions' worth of features, and pushed the branch.
6. **10 September, later.** The user opened GitHub Desktop, saw only the 27 August state (it was
   showing the stale clone), and asked for the two versions to be combined: today's progress plus
   the newer Contact page, the landing page with the updated "How a job runs" animation, and the
   Service areas pages from GitHub master. That integration was in progress when this document was
   written.

---

## 3. Feature inventory since GitHub master

Grouped by where the feature lives today. Commit references are on `feature/headless-cms` unless
noted. The README describes how each feature works; this lists what exists and its state.

### 3.1 Headless CMS (on both `feature/headless-cms` and local `master`)

Built 8–9 September to the spec in
[2026-09-08-headless-cms-design.md](superpowers/specs/2026-09-08-headless-cms-design.md) and the
plan in [2026-09-08-headless-cms.md](superpowers/plans/2026-09-08-headless-cms.md).

| Feature                                                                   | Commits                                                                    |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Supabase clients, env guard, migration `0001_cms.sql`                     | `6492fda`                                                                  |
| Zod content schemas, `Post` type                                          | `dc7738b`                                                                  |
| Content source adapter with cache tags and TypeScript fallback            | `11d0bc6` `58d42fc` `8c1496e`                                              |
| Image processing (sharp: dimensions, blur, hashed names) and seed script  | `24ac2f4` `5fc653e` `0560149`                                              |
| Magic-link admin auth behind `proxy.ts` and `admin_allowlist`             | `c1ca1cf` `f70ea7c` `1fc87f4`                                              |
| Media library with immutable uploads                                      | `6ad5987` `3782f9c`                                                        |
| Entry editor: draft, publish, preview, rename, unpublish                  | `e75badf` `c33bd6a`                                                        |
| Claude-drafted summaries, meta descriptions and alt text                  | `a4bb12f` `d305bf1`                                                        |
| CMS-backed blog with `BlogPosting` schema and sitemap entries             | `b75475d`                                                                  |
| Business details (`settings/site`) and contact page singletons            | `e6c983c` `fadc340` `6a15a66` `ffbe73c`                                    |
| Editor as its own Vercel deployment with cross-site revalidation          | `23ffa13` `54c9286` `5e724e2`                                              |
| Public site moved into the `(site)` route group; admin has its own layout | `41d059f` `c238d28` `0674529`                                              |
| Hero image preload with `fetchpriority=high`                              | `5a97649`                                                                  |
| Verification sweep and deferred items                                     | `14575f4` → [plan](superpowers/plans/2026-09-09-cms-verification-sweep.md) |
| `/admin` served on a single local dev server                              | `1a9055a` (master: `7e784e7`)                                              |

**State:** code complete, reviewed, unit-tested with mocks. Nothing database-, AI- or
Vercel-dependent has run live. The 14-step sweep in the verification plan is the gate before merge.

**Live attempt on 10 September.** A Supabase project was created and the migration run. Two things
were learned that the README did not say until now:

- New Supabase projects ship with the legacy JWT keys disabled. The values for
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must be the **Publishable key**
  (`sb_publishable_…`) and **Secret key** (`sb_secret_…`) from Project Settings → API Keys. The
  code needs no change; the old `eyJ…` keys fail with "Legacy API keys are disabled".
- The dev server runs on port 3001, so the Supabase redirect allowlist needs
  `http://localhost:3001/admin/auth/callback/`, not 3000.

The user then chose to switch Supabase off for now. The three Supabase lines in `.env.local` are
commented out and the site runs from the TypeScript content. The seed was never run.

### 3.2 Local preview mode for the admin (in `f379252`; also `8dabbfa`)

In development with no Supabase keys, `/admin` opens without a login and shows every collection
filled from the built-in content, read-only. Save, publish, upload and delete return
"Local preview: no database is configured, so changes are not saved." Never active in production
(`isLocalPreview()` in `lib/supabase/env.ts`). Added so Farbod and Zac can look at the editor
before a database exists.

### 3.3 Page editor for Farbod and Zac (`feature/cms-page-editor`, in progress)

Spec: [2026-09-10-cms-page-editor.md](superpowers/specs/2026-09-10-cms-page-editor.md). The brief,
in the user's words: they should be able to swap out images and text with help from an AI summary,
and must not be able to reposition anything.

What it adds on top of the existing admin: a **Pages** landing view listing every public page with
a thumbnail; each page shown as its sections in site order; images as thumbnails with a **Swap
image** button and alt text; text as labelled fields in plain words; fixed copy greyed out; lists
edited as items instead of JSON; technical fields under **Advanced**; a **Media** grid of the 21
repo photos with dimensions and search; a banner saying saves are off in local preview.

**State at time of writing:** a background agent had been building for about 20 minutes in
`.worktrees/page-editor`. Present and uncommitted there: `app/admin/pages/`,
`components/admin/fields.tsx`, `components/admin/media-browser.tsx`,
`components/admin/media-modal.tsx`, `lib/admin/`, `lib/media/local-library.ts`, two new test files,
and edits to the entry form, form fields, admin layout and media page. Expected on
http://localhost:3002/admin/ once the agent reports and its work is reviewed.

Two alternatives were weighed and declined for now: adopting Payload CMS inside the app (a full
admin with blocks, live preview and rich text, two to three days) or Sanity with Visual Editing
(click-on-the-page editing, hosted content). Both remain options if the home-grown editor is not
enough.

### 3.4 Free site assessment CTA and booking form (in `f379252`)

The site's one call to action changed from "Get a quote" to **"Get a free site assessment"**,
everywhere: header, mobile menu, home CTA band, commercial, sector and office pages, both 404 pages,
`llms.txt` and the contact page heading. The anchor is `/contact-us/#assessment`; `#commercial`
still works.

The form is a booking, not a quote request. Fields, in order: where the site is (Metropolitan
Melbourne / Elsewhere in Victoria / Interstate), on-site visit or online assessment, sector, site
address, preferred times, optional notes, then organisation, name, phone and work email. Scope
summary, timeframe and operating-hours constraints are gone.

Rules and decisions:

- **On-site visits are Melbourne-only.** The on-site option is disabled with a note as soon as a
  region outside Melbourne is chosen, and the Zod schema refuses it server-side as a cross-field
  refinement, so the rule cannot be bypassed without JavaScript.
- **Online assessments are a Google Meet call.** The team confirms a time by email with the Meet
  link. No calendar integration was built; email scheduling was chosen deliberately.
- **Farbod, Zac and Simon** carry out every assessment and are named on the contact page as a
  trust cue. A "preferred representative" field was built, then removed the same evening: APMG
  assigns internally. The names live in `assessors` in `lib/site.ts`.
- **The floating chat mirrors the form.** Renamed from quote chat to site assessment chat
  (`components/chat/assessment-chat.tsx`), seven questions, same Server Action, same anti-spam
  checks. A unit test asserts the chat flow and the schema agree.
- **Email format.** Subject "Site assessment request — On-site visit — Name, Organisation"; body
  uses the labels the visitor saw, not the enum values.
- The CMS `pages/contact-us` seed defaults carry the new heading and intro. A database seeded before
  this change needs re-seeding or an edit in the admin.

Files: `lib/validation/enquiry.ts`, `lib/enquiry/options.ts`, `lib/enquiry/chat-flow.ts`,
`lib/enquiry/transport.ts`, `components/forms/enquiry-forms.tsx`, `app/actions/enquiry.ts`,
`docs/chat-knowledge-base.md` §8. Tests: `assessment-form`, `assessment-chat`, `chat-flow`,
`validation`, `transport`, `enquiry-action`, e2e `contact` and `critical-flows`.

### 3.5 Brand guide applied (in `f379252`)

Source: [Brand Guide Web Developers.pdf](superpowers/specs/Brand%20Guide%20Web%20Developers.pdf),
the 2025 APMG Services brand guidelines, now the visual source of truth.

| Area        | Before             | After                                                                                                        |
| ----------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Headings    | Fraunces (serif)   | **Oswald** via next/font, weight 500, slight positive tracking                                               |
| Body        | Inter              | **Roboto** via next/font                                                                                     |
| Brand black | `ink` #0F1113      | **#1C1C1C** (Industrial Black); neutral steps re-derived                                                     |
| Brand red   | #C8102E            | Unchanged, already exact                                                                                     |
| OG image    | Georgia on #0F1113 | Oswald and Roboto on #1C1C1C; TTFs checked in under `public/fonts/og/`                                       |
| Copy        | —                  | `brand` export in `lib/site.ts`: group name, descriptor, vision, mission, four values                        |
| About Us    | —                  | "What we stand for" section: intro, vision and mission cards, four value cards                               |
| Schema      | —                  | `Organization.alternateName` (APMG Services, Australian Property Maintenance Group), `slogan`, `description` |
| `llms.txt`  | —                  | Mission, values, group name                                                                                  |

Two deliberate omissions: the guide's mission and purpose statements mention residential clients
and homeowners, and this site has a test banning those words, so the mission is carried with only
the industrial and commercial client types and the purpose statement is not carried. The guide's
entity name "APMG Services Painting Services Pty Ltd" was not adopted; the site keeps
"APMG Painting Services Pty Ltd" from the live site. The three layouts carrying fonts are
`app/(site)/layout.tsx`, `app/admin/layout.tsx` and `app/global-not-found.tsx`. Test:
`tests/unit/brand.test.ts`.

### 3.6 Page and motion polish (in `f379252`)

- **Trade services page** (`app/(site)/trade-services/page.tsx`): both prose sections now carry a
  photograph beside the text, pinned on desktop and first on mobile; the 21:9 photo band that
  cropped the painter's head is gone; the five trade cards became a ruled schedule list. Photos are
  real APMG job photos from the live WordPress uploads. The shared figure component in
  `components/sections/index.tsx` changed with it, so the homepage Noble Park figure matches.
- **FAQ accordion** animates open and closed in pure CSS (`::details-content` with
  `interpolate-size`), keeping `FaqList` a server component. 260 ms on the shared `ease-decel` curve.
- **Contact Us "Property or sector type" select** wrapped in Tailwind with a custom chevron;
  browsers with customisable-select support get a fading, dropping picker via `.select-control` in
  `globals.css`; others keep the native list.
- **Desktop "Commercial" menu** fades and slides in; caret rotates. **Mobile menu** sections
  animate height; collapsed sections are inert so the focus trap skips them.
- All motion honours `prefers-reduced-motion`.

### 3.7 On GitHub master only (25–27 August), absent from `feature/headless-cms`

From the commit log of `origin/master`:

- `/areas/` restructured to `[state]/[region]/[suburb]` with a 22-region model, 1,440 generated
  locality records (`content/locations.generated.json`), 45 hand-authored council notes, haversine
  distance and four service-radius anchors (`lib/geo/`, `lib/locations/`), legacy suburb redirects
  generated from the data, and a no-QLD-presence copy test. Spec and plan:
  `docs/superpowers/specs/2026-08-25-apmg-painting-areas-vic-qld-design.md`,
  `docs/superpowers/plans/2026-08-25-areas-vic-qld.md` (on `master`, not on this branch).
- Service Areas in the main nav with its own footer column.
- "How a job runs" homepage process section (`content/approach.ts`,
  `components/icons/process-icons.tsx`) with the updated animation.
- Schema, sitemap, `llms.txt` and homepage moved onto the locality layer.
- Sandbox noindex lockdown removed ("Go live", `7d7129f`) and made to release as one.
- Breadcrumbs moved to the top of every page.
- A newer Contact page structure (channel row), restored onto local `master` in `e208455`.
- `docs/image-sources.md`.

---

## 4. Integration plan

The plan proposed in the 10 September session, before the user redirected it toward "copy the
design in", was:

1. Cherry-pick `f379252` onto local `master`. Expected conflicts: the contact page,
   `components/sections/index.tsx`, `lib/site.ts`, `globals.css`, because master restored the
   live contact page structure.
2. Push `master` to GitHub so GitHub, GitHub Desktop and VS Code agree.
3. Rebase `feature/cms-page-editor` onto the new master.
4. Delete the stale `Desktop\APMG-Painting` clone.

The user's stated end state: one codebase with today's progress **plus** the newer Contact page,
the landing page with the updated "How a job runs" animation, and the Service areas pages from
GitHub master. Whichever branch becomes canonical, check these survive:

- [ ] Oswald/Roboto in all three layouts and `#1C1C1C` in `tailwind.config.ts`
- [ ] `brand` and `assessors` exports in `lib/site.ts`; "What we stand for" on About Us
- [ ] "Get a free site assessment" in header, mobile menu, CTA band, 404s, `llms.txt`
- [ ] `siteAssessmentSchema` with the Melbourne-only refinement; `assessment-chat.tsx`
- [ ] Trade services photos and schedule list; FAQ and select animations
- [ ] `isLocalPreview()` and the local preview message in the admin actions
- [ ] Development-mode `/admin` redirect exception in `next.config.ts`
- [ ] `/areas/[state]/[region]/[suburb]`, `lib/locations`, `lib/geo`, `content/approach.ts`
- [ ] The README additions (site assessment, brand, local preview, Supabase keys) and this document

After integration: run `npm run verify`, then the e2e suite, then the 14-step CMS sweep once
Supabase is back on.

---

## 5. Local environment notes

| Item                           | Value                                                                      |
| ------------------------------ | -------------------------------------------------------------------------- |
| Dev server, main tree          | http://localhost:3001 (`/admin/` opens in local preview mode)              |
| Dev server, page editor        | http://localhost:3002 (worktree `.worktrees/page-editor`)                  |
| Port 3000                      | Belongs to the APMG-Outreach project, not this one                         |
| Ports 3124–3127                | Four stale `next start` servers from 9 September; safe to kill             |
| `.env.local` Supabase lines    | Commented out on 10 September at the user's request                        |
| Supabase keys, when re-enabled | `sb_publishable_…` and `sb_secret_…`, not the legacy `eyJ…` pair           |
| Supabase redirect URL          | `http://localhost:3001/admin/auth/callback/`                               |
| Node/Next                      | Next 16.3.2 (Turbopack), React 19, Tailwind 3.4, Vitest 4, Playwright 1.62 |
| Test counts at `f379252`       | 33 unit test files, 304 tests; 60 e2e passed, 10 skipped by design         |

---

## 6. Claude session index

Transcripts live in `%USERPROFILE%\.claude\projects\c--Users-Kane-Desktop-APMG-Painting-v2\`.
Dates are the machine's local time.

| Date      | Session                                     | Branch                                      | What happened                                                                                                                                    |
| --------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 23 Aug    | `3242aa06` `e999057e` `cb436c46`            | master                                      | Initial Next.js rebuild of apmgpainting.com.au                                                                                                   |
| 24 Aug    | `4c09cca1` `364606e3` `04fe68e5` and others | master                                      | Preview refinements; GSAP/Three.js paint-stroke idea built then removed; mobile drawer fix; GitHub repo created; two-clone confusion first found |
| 24–25 Aug | `160a68dd`                                  | master                                      | VIC + QLD areas design and plan; "no worktrees, one from main"                                                                                   |
| 25 Aug    | `65fa1442`                                  | master                                      | Residential/house painting removed after the boss objected; `no-residential` test                                                                |
| 25 Aug    | `f0219196`                                  | master                                      | Stats strip rewritten (11 years · ~30 years · 8 sectors · 5-year warranty); "10,000 happy clients" declined                                      |
| 25 Aug    | `58410730`                                  | master                                      | Which meta tags matter for ranking; the sandbox gate                                                                                             |
| 31 Aug    | `5df82111` `b96ce901`                       | master                                      | "In Their Words" section removed; breadcrumbs moved to the top of hero pages                                                                     |
| 8 Sep     | `00356e1a`                                  | feature/headless-cms                        | Trade services photos from the live site; smooth FAQ accordion                                                                                   |
| 8–10 Sep  | `ea7320a5`                                  | feature/headless-cms → page-editor worktree | CMS plan, implementation, two-deployment design, Supabase attempt, local preview mode, page editor spec and build                                |
| 9 Sep     | `e34544de`                                  | feature/headless-cms                        | Brand guide applied                                                                                                                              |
| 9–10 Sep  | `469133f7`                                  | feature/headless-cms                        | Free site assessment CTA, booking form, chat; nav animations; stale servers found                                                                |
| 10 Sep    | `943bb31b`                                  | feature/headless-cms                        | Trade services section redesign                                                                                                                  |
| 10 Sep    | `b65958b7`                                  | feature/headless-cms                        | Contact Us select dropdown animation                                                                                                             |
| 10 Sep    | `db479964`                                  | feature/headless-cms                        | GitHub Desktop showing the stale clone; branch tangle diagnosed; integration started                                                             |
| 10 Sep    | `adfcdda8`                                  | feature/headless-cms                        | This document and the README updates                                                                                                             |

Memory notes for future sessions are in the same folder under `memory/`.
