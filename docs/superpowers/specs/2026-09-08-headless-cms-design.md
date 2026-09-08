# APMG headless CMS — design

**Date:** 2026-09-08
**Status:** Proposed. Starts after the v2 design is signed off.
**Editors:** Farbod and Zac (APMG), Kane (admin).

## 1. What it is

A small, self-hosted headless CMS inside the existing Next.js app. Editors log
in at `/admin/`, change text and swap images on projects and services, write
blog posts, and press one button to have Claude draft the post summary, meta
description and image alt text. Every save republishes the affected pages
within seconds. Nothing about the public site's rendering model changes: pages
stay statically generated and served from Vercel's CDN.

Supabase supplies three things: Postgres (content), Storage (images) and Auth
(magic-link login). It is provisioned through the Vercel Marketplace so env
vars land in the Vercel project automatically.

## 2. Scope

**Phase 1 (this spec):**

- Collections editable in the CMS: `projects`, `services`, `posts` (new blog).
- Two singletons: `settings/site` (business details: phone, email, address and
  move date, opening hours, ABN, map coordinates, social links) and
  `pages/contact-us` (the contact page's heading, lede, form heading and
  intro, meta title and description). Changing the phone number or address
  in one place updates the header, footer, contact page, about page, mobile
  menu, chat widget, form status messages, `llms.txt` and the LocalBusiness
  structured data together.
- A media library: upload, alt text, reuse across entries.
- AI assist: summary/excerpt, meta title and description, alt text for an image.
- Draft → published status per entry, with server-rendered preview.
- On-save revalidation of the affected pages and the sitemap.

**Explicitly deferred (phase 2):** sectors, locations, FAQs, reviews,
accreditations, and the company's trading and legal names. The names stay in
code because the one-company-name rule is a correctness constraint, not
copy. Sectors and locations carry the site's SEO rules
(one query per page, evidence-gated indexability) and the navigation reads
sectors synchronously. Moving them behind the CMS needs its own review of who
may change what. They stay in TypeScript until then.

## 3. Content model

One table, `content_entries`, with a JSONB `data` column per entry, validated
by a Zod schema per collection that mirrors the existing types in
`lib/content/types.ts`. Components keep receiving `Project`, `Service` and the
new `Post` type. That is the "CMS swap is an adapter change" promise the types
file already makes.

Why JSONB rather than one table per collection: the shapes are nested
(`images[]`, `scopeOfWork[]`, `testimonial{}`) and read whole. Nothing queries
inside them. A typed schema at the boundary gives the safety a relational
schema would, without a migration every time a field is added.

```
content_entries
  collection   text   'projects' | 'services' | 'posts' | 'settings' | 'pages'
  slug         text
  status       text   'draft' | 'published'
  data         jsonb  validated by lib/content/schemas.ts
  updated_at   timestamptz
  updated_by   text   editor email
  primary key (collection, slug)

media
  id             uuid pk
  storage_path   text unique   e.g. 'projects/3f9a2c-noble-park-factory-01.webp'
  public_url     text
  width, height  int
  blur_data_url  text          16px webp data URI for placeholder="blur"
  alt            text
  mime_type      text
  bytes          int
  created_at, created_by

admin_allowlist
  email  text pk
```

Row level security: anon may `select` published `content_entries` and all
`media`. Authenticated users whose email is in `admin_allowlist` may do
everything. No service-role key is used at runtime; only the one-off seed
script uses it.

`settings` and `pages` are singleton collections: one fixed slug each
(`site`, `contact-us`), no "New" button, no delete. Their Zod schemas derive
what can be derived: the `tel:` link is computed from the display number, so
an editor types "1300 97 97 40" once and cannot produce a mismatched link.
A phone number that fails Australian formatting, or an ABN that is not
eleven digits, is rejected at save.

Business details reach client components (mobile menu, chat widget, form
status) through a React context set once in the root layout, so those
components never import the database and the pages stay static.

The current TypeScript content files become the **seed** and the **fallback**.
When `NEXT_PUBLIC_SUPABASE_URL` is unset (local dev without a database, unit
tests, the sandbox preview) the adapter returns the TypeScript arrays. When it
is set, Supabase is the source of truth.

## 4. Images — the fast path

Goal: LCP under 2.5 s on the project hero, zero layout shift, and every image
served from a CDN edge with a one-year cache.

1. **Immutable object names.** Files are stored as
   `<collection>/<first 6 hex of sha256>-<slugified name>.<ext>`. Replacing an
   image creates a new object. Nothing is ever overwritten, so nothing ever
   needs cache-busting.
2. **One-year cache at the origin.** Uploads set `cacheControl: '31536000'`.
   Supabase Storage sits behind its CDN; the public URL is cacheable forever.
3. **Dimensions and blur stored at upload.** `sharp` reads width/height and
   renders a 16 px blur placeholder once. Pages render
   `<Image width height placeholder="blur" blurDataURL>` so the browser
   reserves space before the file arrives. That is what removes CLS.
4. **Next.js optimizes and Vercel caches.** `next/image` requests the Supabase
   original once per size, converts to AVIF/WebP, and Vercel caches the
   result at the edge. `images.minimumCacheTTL` is set to one year because
   the source never changes under a URL. After the first visitor to a given
   size, every visitor gets an edge hit.
5. **Hero images are `priority`** with an explicit `sizes`. Next emits a
   `<link rel=preload>` with `fetchpriority=high` for them.

**Alternative kept in reserve:** Supabase Image Transformations
(`/storage/v1/render/image/...`, Pro plan) via a custom `next/image` loader.
It moves resizing off Vercel's optimizer. It is not faster for the visitor
once Vercel's edge cache is warm, so it is only worth switching to if Vercel
image-optimization usage becomes a cost line. The adapter isolates the URL
building so that switch is one file.

## 5. Publishing and caching

Pages stay static. Data reads go through `unstable_cache` with a tag per
collection (`content:projects`, `content:services`, `content:posts`,
`content:settings`, `content:pages`) and `revalidate: false`. The admin
save action calls `updateTag(<tag>)` and `revalidatePath('/sitemap.xml')`.
A settings save also calls `revalidatePath('/', 'layout')`, because the
phone number is on every page. Because the editor is a separate deployment
(§8a), the same tags and paths are also sent to the public site's
`/api/revalidate` endpoint. New slugs are served on first request via
`dynamicParams = true` on the collection routes and then cached.

`llms.txt` reads the same adapter so answer engines see the same copy.

## 6. Editing

- `/admin/` — list of collections and the media library.
- `/admin/media/` — grid, upload, edit alt text.
- `/admin/<collection>/` — entries with status.
- `/admin/<collection>/<slug>/` — form rendered from the collection's Zod
  schema: strings become inputs or textareas, string arrays become one line
  per item, image fields open the media picker, booleans become checkboxes.
  Nested object arrays (project `images`, `testimonial`) render as a
  validated JSON textarea in phase 1.
- Save as draft / Publish / Preview. Preview renders the real page component
  with draft data at `/admin/preview/<collection>/<slug>/`.
- Every AI button fills a field; the editor still has to save. AI never
  publishes.

## 7. AI assist

Server actions in `app/actions/ai.ts`, calling the Anthropic SDK directly
with `claude-opus-5` and structured outputs, so the response is typed and
validated before it reaches the form:

- `draftPostSummary(body)` → `{ excerpt, metaTitle, metaDescription }`.
- `describeImage(mediaId)` → `{ alt, caption }` from the image URL (vision).
- `summariseProject(project)` → `{ summary, metaDescription }`.

Prompts carry the house rules from `docs/chat-knowledge-base.md`: commercial
only, no invented claims, Australian English, one company name. Effort is
`low` for these short tasks. Server-side refusal fallbacks are on.

## 8. Auth

Supabase Auth magic link. `proxy.ts` refreshes the session cookie and
redirects unauthenticated `/admin/*` requests to `/admin/login/`. The server
then checks the email against `admin_allowlist` on every admin render and
every action. `/admin/` is `noindex`, excluded from the sitemap, and
disallowed in `robots.ts`.

## 8a. Deployment: two Vercel projects, one repo

The editor runs at its own address, separate from the public site:

|                        | Public site                  | Editor                                                                             |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| Vercel project         | `apmg-painting`              | `apmg-painting-editor`                                                             |
| Domain                 | `apmgpainting.com.au`        | `edit.apmgpainting.com.au` (or the project's `*.vercel.app` link until DNS is set) |
| `NEXT_PUBLIC_APP_ROLE` | `site`                       | `editor`                                                                           |
| `NEXT_PUBLIC_SANDBOX`  | `false` at go-live           | never `false`: the editor is always noindex                                        |
| Serves                 | everything except `/admin/*` | only `/admin/*` and `/api/revalidate` is not needed here                           |
| Supabase               | same project, anon key       | same project, anon key                                                             |

Both projects deploy from the same GitHub repo and the same branch, so one
commit updates both. The role is a build-time env var read in
`next.config.ts`: on the editor, every non-admin path redirects to
`/admin/`; on the site, `/admin/*` redirects to the editor's address. These
are build-time redirects, so the public site pays no per-request cost and
stays fully static.

**Why separate.** The bosses get one bookmarkable link that is only the
editor. The public domain never serves a login form, never runs the proxy,
and never ships the admin bundle. A mistake in the editor cannot take the
public site down, and the editor can be redeployed or rolled back on its own.

**Cross-deployment publishing.** `updateTag` only clears the cache of the
deployment it runs in. When the editor publishes, it also calls
`POST https://apmgpainting.com.au/api/revalidate` with a shared secret and
the tags and paths to refresh. The public site's route handler calls
`revalidatePath` for each path (immediate) and `revalidateTag(tag, 'max')`
for the collection tag. The secret is `REVALIDATE_SECRET`, set on both
projects; a request without it is a 401 and does nothing. If the call fails,
the save still succeeds and the editor sees "Saved, but the live site did not
refresh. Try Publish again." so nothing is silently lost.

Preview at `/admin/preview/...` renders on the editor deployment from the
same page components, so drafts are seen exactly as the public site will
render them.

## 9. Non-goals

No WYSIWYG editor (Markdown for posts). No versioning beyond `updated_at`.
No scheduled publishing. No image cropping in the browser. No RSS.

## 10. Risks

- **Build needs the database.** `next build` reads content. The fallback
  covers a missing env var but not a Supabase outage mid-build. Mitigation:
  Vercel keeps the previous deployment live on build failure.
- **Editors can break SEO copy.** Phase 1 only exposes projects, services and
  posts, none of which carry the one-query-per-page rule. Meta fields have
  length hints in the form.
- **Supabase free tier pauses after a week idle.** Use the Pro plan in
  production, or the Marketplace billing through Vercel.
