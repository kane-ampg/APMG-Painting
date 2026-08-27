# APMG Painting — Next.js rebuild

A preview build of a rebuilt [apmgpainting.com.au](https://apmgpainting.com.au). **This is not the
live site**, and it is not ready to be. It exists so the direction can be reviewed before the real
migration starts.

The live WordPress site is untouched.

---

## Read this first

Two things about this build are deliberate and easy to mistake for bugs.

**1. Enquiries are not delivered.** No email or CRM credentials exist for this project yet, and
where Contact Form 7 submissions currently land on the WordPress site is unknown. Rather than
pretend, the app ships a transport adapter whose default implementation delivers nothing and says
so. Submit a form and you get: _"Your details passed validation — but were not sent."_ See
[Enquiry delivery](#enquiry-delivery).

**2. The whole site is `noindex`.** `NEXT_PUBLIC_SANDBOX` defaults to `true`, which forces a
`noindex, nofollow` robots directive on every page, an `X-Robots-Tag` response header, and a
`Disallow: /` robots.txt. A preview must never be crawled alongside the live site. This is flipped
at go-live, not before.

There is also an orange banner across the top of every page saying the same thing. It is removed by
setting `NEXT_PUBLIC_SANDBOX="false"`.

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

---

## How it is put together

```
app/                    Routes. Static by default.
  [sector]/             Sector pages at the root, preserving their live URLs
  areas/[slug]/         Location pages, indexable per-record
  projects/[slug]/      Case studies
  actions/enquiry.ts    Server Action — exports only async functions
  sitemap.ts robots.ts  Generated, excluding noindex URLs
components/
  forms/                Field primitives with mandatory labels, plus both forms
  navigation/           Desktop nav, mobile drawer (the only client component in the header)
  sections/ ui/         Presentation, no content
  seo/                  JSON-LD renderer
content/                Typed content modules — the CMS seam
lib/
  site.ts               Canonical business facts. Single source of truth.
  content/types.ts      Content models
  schema/               JSON-LD builders
  validation/           Zod schemas, shared client and server
  enquiry/              Transport adapter, rate limiter, form state
tests/
  unit/                 Vitest
  e2e/                  Playwright
```

**`lib/site.ts` matters more than its size suggests.** The live site renders the company name four
different ways — "APMG Painting", "APMG Painting Services", "APMG Services", "APMG Painting Services
Pty Ltd" — plus one typo ("AMPG"). Every surface that states a business fact imports from this one
module, so that drift cannot recur. A unit test fails the build if the old variants reappear.

**Content is local TypeScript, not a CMS.** This was a deliberate decision, pending confirmation of
who actually edits the site. Everything goes through typed accessors in `content/`, so swapping the
source for a CMS later is one adapter rather than a rebuild.

---

## Enquiry delivery

`lib/enquiry/transport.ts` defines an `EnquiryTransport` interface with two implementations:

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

Nothing in this repository guarantees any particular search ranking.
