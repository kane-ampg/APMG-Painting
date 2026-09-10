# APMG Painting — Next.js rebuild

A preview build of a rebuilt [apmgpainting.com.au](https://apmgpainting.com.au). **This is not the
live site**, and it is not ready to be. It exists so the direction can be reviewed before the real
migration starts.

The live WordPress site is untouched.

---

## Read this first

Two things about this build are deliberate and easy to mistake for bugs.

**1. Site assessment bookings are not delivered.** No email or CRM credentials exist for this
project yet, and where Contact Form 7 submissions currently land on the WordPress site is unknown.
Rather than pretend, the app ships a transport adapter whose default implementation delivers
nothing and says so. Submit the booking form (or finish the chat) and you get: _"Your details
passed validation — but were not sent."_ See [Free site assessment](#free-site-assessment) and
[Enquiry delivery](#enquiry-delivery).

**2. The whole site is `noindex`.** `NEXT_PUBLIC_SANDBOX` defaults to `true`, which forces a
`noindex, nofollow` robots directive on every page, an `X-Robots-Tag` response header, and a
`Disallow: /` robots.txt. A preview must never be crawled alongside the live site. This is flipped
at go-live, not before.

There is also an orange banner across the top of every page saying the same thing. It is removed by
setting `NEXT_PUBLIC_SANDBOX="false"`.

**3. The repository is mid-integration.** As of 10 September 2026 the CMS and design work exist on
two local histories that split on 24 August, and GitHub master has neither. Which branch has what,
what is pushed, and what is still being built is recorded in
[docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md). Read it before switching branches.

---

## Running it

```bash
npm install
cp .env.example .env.local
npm run dev
```

| Command             | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Development server                                              |
| `npm run build`     | Production build                                                |
| `npm start`         | Serve the production build                                      |
| `npm run lint`      | ESLint                                                          |
| `npm run typecheck` | `tsc --noEmit`                                                  |
| `npm run format`    | Prettier, writing changes                                       |
| `npm test`          | Vitest unit and component tests                                 |
| `npm run test:e2e`  | Playwright end-to-end tests (builds and serves on port 3100)    |
| `npm run verify`    | lint → typecheck → format check → unit tests → production build |

In development one server serves both the public site and `/admin/`. With no Supabase keys in
`.env.local` the admin opens in [local preview mode](#local-preview-mode): no login, built-in
content, saving disabled. Production always splits the two — see [Two deployments](#two-deployments).

---

## How it is put together

```
app/
  (site)/               The public site. Static by default. Its own root layout
    [sector]/           Sector pages at the root, preserving their live URLs
    areas/[slug]/       Location pages, indexable per-record
    projects/[slug]/    Case studies
  admin/                The editor. Its own root layout, force-dynamic, noindex
  actions/enquiry.ts    Server Action — exports only async functions
  sitemap.ts robots.ts  Generated, excluding noindex URLs
components/
  chat/                 The floating site assessment chat — the form's questions as a script
  forms/                Field primitives with mandatory labels, plus the booking form
  navigation/           Desktop nav, mobile drawer (the only client component in the header)
  sections/ ui/         Presentation, no content
  seo/                  JSON-LD renderer
content/                Typed content modules — the CMS seam
lib/
  site.ts               Canonical business facts. Single source of truth.
  content/types.ts      Content models
  schema/               JSON-LD builders
  validation/           Zod schemas, shared client and server
  enquiry/              Booking options, chat flow, transport adapter, rate limiter, form state
tests/
  unit/                 Vitest
  e2e/                  Playwright
```

**`lib/site.ts` matters more than its size suggests.** The live site renders the company name four
different ways — "APMG Painting", "APMG Painting Services", "APMG Services", "APMG Painting Services
Pty Ltd" — plus one typo ("AMPG"). Every surface that states a business fact imports from this one
module, so that drift cannot recur. A unit test fails the build if the old variants reappear.

**Content lives in typed TypeScript files under `content/`** as the seed and the no-database
fallback — the app runs from these with no Supabase configured. Once Supabase is configured, the
CMS (see [CMS](#cms) below) is the source of truth for projects, services, posts, business details
and the contact page. Sectors, suburbs, FAQs, reviews and accreditations stay in code on purpose.

---

## CMS

### Two deployments

The editor (`/admin/*`) runs as its own Vercel project, separate from the public site, both built
from the same repo and the same branch:

|                        | Public site                  | Editor                     |
| ---------------------- | ---------------------------- | -------------------------- |
| Vercel project         | `apmg-painting`              | `apmg-painting-editor`     |
| Domain                 | `apmgpainting.com.au`        | `edit.apmgpainting.com.au` |
| `NEXT_PUBLIC_APP_ROLE` | `site`                       | `editor`                   |
| Serves                 | everything except `/admin/*` | only `/admin/*`            |

Same repo, same branch, two projects, different `NEXT_PUBLIC_APP_ROLE`. The role is a build-time
env var read in `next.config.ts`, so the redirect that keeps each deployment in its lane
(`/admin` → editor on the site, everything else → `/admin/` on the editor) costs nothing at
request time and the public site stays fully static. When the editor publishes, it calls the
public site's `/api/revalidate` with a shared `REVALIDATE_SECRET` so the change goes live there
too — see `lib/revalidate/notify.ts` and `app/api/revalidate/route.ts`.

### Content editing

Editors sign in at `/admin/` with a magic link (`supabase.auth.signInWithOtp`) — no password. Who
may edit is decided by the `admin_allowlist` table in Supabase, not by a role in code: an
authenticated session is not enough on its own, the signed-in email must also be listed there.

Projects, services and blog posts are edited in the CMS, along with two singletons — business
details (`settings/site`: phone, email, address, hours, ABN, map coordinates, social links) and the
contact page (`pages/contact-us`). Sectors, suburbs, FAQs, reviews and accreditations stay in
`content/*.ts` on purpose — see
[`docs/superpowers/specs/2026-09-08-headless-cms-design.md`](docs/superpowers/specs/2026-09-08-headless-cms-design.md#2-scope)
§2 for why.

Without `NEXT_PUBLIC_SUPABASE_URL` set, the site runs entirely from the TypeScript content files
and `/admin/` is unavailable. To seed a fresh Supabase project from that same content:

```bash
node --env-file=.env.local scripts/seed-cms.mjs
```

**Images** go through the media library, not a file upload field on the entry. Each file is stored
under a hashed, content-derived name with a one-year, immutable `Cache-Control`. Never edit an
image in place — the hash would no longer match the bytes. Upload the replacement as a new file and
swap it into the entry instead.

**Alt text in the library is a default, not a live link.** An entry stores its own `alt` alongside
each image, copied from the library row at the moment the image is picked. Editing alt text at
`/admin/media/` therefore changes the library default — images already placed on a page keep their
alt text until re-picked. To correct a page that is live, re-pick the image on that entry. This is
deliberate for phase 1: propagating a library edit needs a reverse index from storage path to
entry, plus a rule for entries whose alt text an editor overrode on purpose.

### Local preview mode

In development with no `NEXT_PUBLIC_SUPABASE_URL`, `/admin/` opens without a login and shows
every collection filled from the TypeScript content, read-only. Save, publish, upload and delete
return _"Local preview: no database is configured, so changes are not saved."_ The switch is
`isLocalPreview()` in `lib/supabase/env.ts`, which is false whenever `NODE_ENV` is
`production`, so a deployed site can never open the admin this way. It exists so the editor can
be looked at before a Supabase project exists.

### Page editor (in progress)

The admin that ships today is a field editor: raw schema keys as labels, nested values as JSON. A
page-by-page editor for Farbod and Zac is specified in
[`docs/superpowers/specs/2026-09-10-cms-page-editor.md`](docs/superpowers/specs/2026-09-10-cms-page-editor.md)
and being built on `feature/cms-page-editor`: every public page listed with a thumbnail, each
shown as its sections in order, images swapped from a media grid, text in labelled fields, lists as
items, nothing addable, removable or reorderable. It runs first in local preview mode against the
repo's photos and works unchanged once Supabase is configured.

### Supabase keys

New Supabase projects disable the legacy JWT keys. Use the **Publishable key**
(`sb_publishable_…`) as `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the **Secret key**
(`sb_secret_…`) as `SUPABASE_SERVICE_ROLE_KEY`, from Project Settings → API Keys. The old
`eyJ…` pair fails with "Legacy API keys are disabled". The Auth redirect allowlist must contain
the dev server's actual port — locally that has been 3001, not 3000.

---

## Free site assessment

The site has one call to action, **"Get a free site assessment"**, in the header, the mobile menu,
the home CTA band, the commercial, sector and office pages, both 404 pages and `llms.txt`. Every
one lands on `/contact-us/#assessment` (`#commercial` still resolves). It replaced "Get a quote"
on 9 September 2026 because a free assessment gives a facilities manager a reason to talk before
they have a scope document, and because APMG prices nothing from a photograph anyway.

The form is a **booking, not a quote request**. It asks, in order:

| Field             | Choices / rule                                                                  |
| ----------------- | ------------------------------------------------------------------------------- |
| Where is the site | Metropolitan Melbourne · Elsewhere in Victoria · Interstate                     |
| Assessment type   | **On-site visit** (Melbourne only) · **Online assessment** (a Google Meet call) |
| Sector            | The eight commercial sectors, or "Something else"                               |
| Site address      | A suburb is enough for an online assessment                                     |
| Preferred times   | Two or three windows; the team confirms one by email                            |
| Notes             | Optional                                                                        |
| Contact           | Organisation, name, phone, work email                                           |

**On-site is Melbourne-only.** Choosing a region outside Melbourne disables the on-site option with
a one-line note, and `siteAssessmentSchema` in `lib/validation/enquiry.ts` refuses the
combination server-side as a cross-field refinement, so neither the form nor the chat can be
talked around it. **Farbod, Zac and Simon** carry out every assessment and are named on the contact
page as a trust cue; the form does not ask which — APMG assigns. The names live in `assessors` in
`lib/site.ts`. No calendar integration exists by design: the team replies by email with a time
and, for online assessments, the Meet link.

**The floating chat is the same form as a script.** `components/chat/assessment-chat.tsx` asks
the seven questions defined as data in `lib/enquiry/chat-flow.ts`, withholds the on-site option
outside Melbourne, and submits through the same Server Action with the same honeypot, timing and
rate-limit checks. A unit test asserts the flow and the Zod schema agree, so a renamed field cannot
leave the chat sending payloads the server refuses. It is deliberately not a chatbot; the grounding
document for when an LLM is wired in is [`docs/chat-knowledge-base.md`](docs/chat-knowledge-base.md).

Choice labels for both surfaces live once, in `lib/enquiry/options.ts`.

---

## Enquiry delivery

`lib/enquiry/transport.ts` defines an `EnquiryTransport` interface with two implementations.
A delivered booking becomes an email with the subject
_"Site assessment request — On-site visit — Name, Organisation"_ and a body that reads back the
labels the visitor saw (`describeRequest`), not the stored enum values.

| Adapter   | When it runs                       | Behaviour                                                                      |
| --------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `console` | Default                            | Logs that a submission occurred. Delivers nothing. Returns `delivered: false`. |
| `resend`  | `ENQUIRY_TRANSPORT=resend` + a key | Sends via Resend.                                                              |

To switch on real delivery, set in `.env.local` (and in Vercel's environment variables):

```
ENQUIRY_TRANSPORT="resend"
RESEND_API_KEY="..."
ENQUIRY_TO_EMAIL="..."
ENQUIRY_FROM_EMAIL="..."
```

Submitted content is never logged. The console adapter records the form type and a field count —
no name, phone, email or free text.

### Still missing

- **Where enquiries should be delivered.** An address, and whether a CRM sits behind it.
- **File uploads.** Both forms are specified with an optional upload, and neither ships one. It
  needs storage provisioned first, plus server-side type and size validation and a non-public
  bucket. The forms say so on the page rather than showing a control that does not work.
- **Shared-store rate limiting.** `lib/enquiry/rate-limit.ts` is in-memory, so serverless instances
  do not share counts. It stops casual hammering, which is what it is for, but it should move to
  Upstash Redis or Vercel KV before go-live.
- **Analytics.** `NEXT_PUBLIC_GTM_ID` and the CallRail script are blank so review traffic is not
  counted. Live values are `GTM-N7D3JPMV` and CallRail company `384170337`. Google Ads conversion
  tracking (`AW-11266421898`) must be verified on staging before any DNS change, or paid spend goes
  blind at cutover.

---

## Content that is not real yet

Anything unverified renders as a visible, labelled placeholder rather than being invented or quietly
omitted. You will see these on the page:

- **Accreditations.** None is marked verified in `lib/site.ts`, so none is displayed as a
  credential. The live site names the Master Painters body five different ways, cites a body that
  does not exist ("registered with Workplace Safety"), and describes an "NDIS Accreditation" where
  the real credential is an NDIS Worker Screening Check. Certificates are needed.
- **ABN.** Not published anywhere on the live site. Required for complete `LocalBusiness` schema.
- **Testimonials.** The site has none with attribution. The Noble Park case study carries a quote
  the live page attributes only as "Client feedback".
- **Two thin case studies.** Glen Iris (155 words on the live site) and Newbay Medical (164 words)
  have no scope, preparation or outcome recorded. They are listed but excluded from featured slots.
- **Project photography for two projects.** The images on the NDIS and Newbay case studies are
  genuine APMG commercial work but were **not** photographed at those sites. Alt text says only what
  each image actually shows. Replace before publication.
- **Location pages.** Seven of the live site's 68 are modelled here as a representative sample.
  Sorting all 68 into keep / consolidate / noindex / redirect needs APMG's real project list plus
  Search Console impression data.

---

## Brand

The 2025 APMG Services brand guide
([`docs/superpowers/specs/Brand Guide Web Developers.pdf`](docs/superpowers/specs/Brand%20Guide%20Web%20Developers.pdf))
is the visual source of truth, applied on 9 September 2026.

- **Type.** Oswald for headings, Roboto for body, the guide's first-choice pair, self-hosted through
  `next/font` in the three layouts (`app/(site)/layout.tsx`, `app/admin/layout.tsx`,
  `app/global-not-found.tsx`). Oswald is condensed, so display text carries weight 500 and a hair
  of positive tracking from one rule in `app/globals.css`; there is no `tracking-tight` on
  headings anywhere.
- **Colour.** `ink` is the guide's Industrial Black `#1C1C1C`, with the raised, soft and muted
  steps re-derived as true neutrals. Brand red `#C8102E` was already exact.
- **Open Graph card.** `app/(site)/opengraph-image.tsx` renders in Oswald and Roboto on
  `#1C1C1C`. The image renderer cannot use `next/font`, so the two TTFs it needs are checked in
  under `public/fonts/og/`.
- **Statements.** `brand` in `lib/site.ts` holds the group name (APMG Services), the descriptor
  (Australian Property Maintenance Group), ownership, vision, mission and the four core values —
  expertise, passion, professionalism, integrity. It feeds the About Us "What we stand for"
  section, `Organization.alternateName`, `slogan` and `description` in the schema, `llms.txt`
  and the chat knowledge base.

Two things from the guide were deliberately **not** carried. Its mission and purpose statements
address homeowners and residential clients; this is the commercial business and a unit test bans
those words, so the mission is quoted with only the industrial and commercial client types and the
purpose statement is left out. Its entity name "APMG Services Painting Services Pty Ltd" is not
used; the site keeps "APMG Painting Services Pty Ltd" from the live site and the trading name from
the domain and Google Business Profile. Test: `tests/unit/brand.test.ts`.

---

## Structured data rules

Held deliberately, and enforced by tests:

- No `aggregateRating` is emitted. The live site displays "5.0, based on 70 reviews" from a
  third-party Google widget; review markup must describe reviews the site itself hosts and can
  evidence.
- The canonical phone number is used, never a CallRail dynamically-inserted tracking number.
- Service area is Melbourne. The live `/commercial/` page's "throughout Australia" claim is not
  carried across — every project APMG can evidence is Victorian. A separate VIC + QLD commercial
  site is planned instead.
- Accreditations appear only once `verified: true`.

---

## URL handling

`trailingSlash: true`, matching every existing URL, so no page moves for cosmetic reasons.

Redirects live in `next.config.ts` and currently cover only slug defects:

| From                           | To                            |
| ------------------------------ | ----------------------------- |
| `/areas/painters-park-dale/`   | `/areas/painters-parkdale/`   |
| `/areas/painters-travencore/`  | `/areas/painters-travancore/` |
| `/areas/painters-garden-vale/` | `/areas/painters-gardenvale/` |

`/about-us/`, `/contact-us/`, `/office-painters/` and all seven existing sector URLs are unchanged.

**The full redirect map is not finished, and must not be treated as if it were.** It needs a Search
Console export of indexed pages — a link-graph crawl cannot see orphaned or unlinked-but-indexed
URLs.

---

## Known gaps before this could go live

1. The live WordPress site is throwing a PHP fatal on every front-end render and needs fixing first.
2. Search Console export, to complete the URL inventory and the redirect map.
3. Business facts and accreditation certificates from APMG.
4. Enquiry delivery configuration.
5. Lighthouse and axe baselines captured against the live site, so "after" numbers mean something.
6. `NEXT_PUBLIC_SANDBOX="false"` and `NEXT_PUBLIC_SITE_URL` set to the real origin.

### CMS go-live

Nothing in the repository applies the migration or provisions the Supabase project. In order:

1. **Apply the migration.** Run `supabase/migrations/0001_cms.sql` against the project — paste it
   into the Supabase SQL editor, or `npx supabase db push` with the CLI linked. Nothing else
   creates the tables, the RLS policies or the `media` storage bucket, and every step below
   depends on them.
2. **Set the environment variables, per role.** Both projects deploy from this repo and this
   branch; they differ only in these values.

   | Variable                        | Public site                        | Editor                                        |
   | ------------------------------- | ---------------------------------- | --------------------------------------------- |
   | `NEXT_PUBLIC_APP_ROLE`          | `site`                             | `editor`                                      |
   | `NEXT_PUBLIC_SITE_URL`          | `https://apmgpainting.com.au`      | same (canonical, not the editor's own origin) |
   | `NEXT_PUBLIC_SANDBOX`           | `false` at go-live                 | leave `true` — never indexable                |
   | `NEXT_PUBLIC_SUPABASE_URL`      | required                           | required                                      |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | required                           | required                                      |
   | `REVALIDATE_SECRET`             | required, identical both sides     | required, identical both sides                |
   | `EDITOR_ORIGIN`                 | `https://edit.apmgpainting.com.au` | unused                                        |
   | `PUBLIC_SITE_ORIGIN`            | unused                             | `https://apmgpainting.com.au`                 |
   | `ANTHROPIC_API_KEY`             | unused                             | required for the AI buttons                   |
   | `SUPABASE_SERVICE_ROLE_KEY`     | never set                          | never set (seed script only)                  |

   Generate the secret with `openssl rand -hex 32`. Without Supabase env on the editor, `/admin`
   answers 503 with a one-line explanation rather than looping.

3. **Add the editors to `admin_allowlist`**, in lowercase. An authenticated session is not enough
   on its own; the signed-in email must be listed there. Farbod's and Zac's addresses, plus
   whoever maintains the site.
4. **Configure Supabase Auth → URL Configuration → Redirect URLs.** Add the editor origin's
   `https://edit.apmgpainting.com.au/admin/auth/callback/` and
   `http://localhost:3000/admin/auth/callback/`. `sendMagicLink` derives the origin from the
   request, so a link sent from the editor points at the editor — but Supabase refuses any
   redirect target not on this list, and the sign-in silently fails without it.
5. **Seed the content:** `node --env-file=.env.local scripts/seed-cms.mjs`. Idempotent, and the
   only place `SUPABASE_SERVICE_ROLE_KEY` is ever used. Needs
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` too, for the public URLs it writes.
6. **`npm run verify` with the keys present.** The build reads content, so verifying without them
   only proves the fallback works.
7. **Deploy both projects**, then run the checks in Task 13 step 9 of
   [`docs/superpowers/plans/2026-09-08-headless-cms.md`](docs/superpowers/plans/2026-09-08-headless-cms.md):
   sign in on the editor, publish a change, confirm it appears on the public site, and confirm
   `/admin` on the public domain lands on the editor.

Nothing in this repository guarantees any particular search ranking.
