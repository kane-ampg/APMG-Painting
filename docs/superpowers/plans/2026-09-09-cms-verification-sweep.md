# CMS verification sweep and deferred items

**Branch:** `feature/headless-cms` (40 commits from checkpoint `068c074`)
**Status:** code complete and reviewed; nothing database-, AI- or Vercel-dependent has run live.

Everything in the CMS was built and unit-tested with mocks because no Supabase
project, Anthropic key or Vercel deployment existed during implementation. This
document is the ordered checklist to run once they do, followed by the review
findings that were deliberately deferred past merge. Run the sweep before
merging to `master`; steps 1–3 gate everything after them.

## Prerequisites

1. Supabase project (region Sydney). Paste into `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (seed script only).
2. `ANTHROPIC_API_KEY` for the AI buttons.
3. Two Vercel projects from this repo (see README "Two deployments") and a
   shared `REVALIDATE_SECRET` (`openssl rand -hex 32`).
4. Farbod's and Zac's email addresses, lowercase, for `admin_allowlist`.

## The sweep

1. **Apply the migration** `supabase/migrations/0001_cms.sql` (SQL editor or
   `npx supabase db push`). Confirm the three tables, the public `media` bucket
   (15 MB, four MIME types) and that `admin_allowlist` holds only lowercase
   addresses.
2. **Build with keys present:** `npm run verify`. The public read path uses a
   session-less client inside `unstable_cache`; a Supabase-configured build
   must be green before going further.
3. **Seed:** `node --env-file=.env.local scripts/seed-cms.mjs`. Verify five
   collections seeded, media rows carry non-zero `width`/`height` and a
   `data:image/webp` blur, and `settings/site` and `pages/contact-us` each
   have exactly one row at the forced slug. Re-run once to prove idempotence.
4. **Anon RLS, signed out:** published entries readable, drafts not, all media
   readable, `admin_allowlist` returns nothing, storage insert/update/delete
   denied.
5. **Admin RLS and forbidden path:** sign in as an allowlisted address and
   confirm read/write on both tables. Sign in as a non-allowlisted address and
   confirm `/admin/*` lands on `/admin/login/?error=forbidden` with the
   tailored notice.
6. **Magic link on the editor deployment specifically:** the emailed link
   points at the editor origin, Supabase Auth → URL Configuration → Redirect
   URLs contains `<editor origin>/admin/auth/callback/` and
   `http://localhost:3000/admin/auth/callback/`, the callback exchanges the code
   and lands on `/admin/`. An expired or reused link lands on `?error=link`.
7. **Media library:** upload a JPEG and a PNG. Verify the hashed object name,
   `curl -I` the public URL for `cache-control: max-age=31536000`, re-upload the
   identical file and confirm the "already exists" path reuses the row, and
   confirm a `.php`-named file lands as `.bin`.
8. **AI buttons against a real key:** "Draft summary with AI" on a post over
   200 characters; "Describe with AI" on an uploaded photo. Confirm nothing
   truncates (`max_tokens` 8000) and that the buttons fill fields and save
   nothing.
9. **Editor loop for each of the five collections:** save draft → preview →
   publish → rename (projects, services, posts) → unpublish. After each publish
   confirm the public page changed and the sitemap picked it up. Use the
   landing page "What we paint" cards as the services acceptance case.
10. **Deploy both Vercel projects.** On the site build, `/admin/` and
    `/admin/media/` redirect out and never render a login form. On the editor
    build, `/`, `/commercial/`, `/projects/...`, `/sitemap.xml` and
    `/robots.txt` all land on `/admin/`, while `/images/**` and `/_next/**`
    still serve. `curl -I <editor>/admin/login/` shows
    `x-robots-tag: noindex, nofollow`.
11. **Cross-deployment publishing:** publish from the editor, confirm HTTP 200
    from the site's `/api/revalidate`, and confirm the live page updates. For
    settings, hit a page outside `pathsFor` (for example `/commercial/`) and
    confirm the new phone number appears on the first request (layout-wide
    revalidation via `layoutPaths`). Then confirm a wrong bearer gives 401, a
    missing secret 503, and that with `PUBLIC_SITE_ORIGIN` unset the editor
    still saves and shows "Saved, but the live site did not refresh".
12. **Lighthouse on a Vercel preview**, mobile and desktop, on `/` and a
    project page. Targets: LCP under 2.5 s mobile, CLS under 0.05. Confirm the
    LCP image request carries `fetchpriority=high` and a second load of an
    optimised image URL returns `x-vercel-cache: HIT`. Local `next start`
    numbers from Task 14 were desktop LCP ~0.9 s / CLS 0 and mobile-simulated
    LCP 3.9 s / CLS 0 with no CDN.
13. **Read-failure fallback:** temporarily revoke the anon key and confirm the
    two singleton getters serve defaults with a console warning while a
    project read fails loudly.
14. **e2e with env:** `npm run test:e2e` un-skips `tests/e2e/admin-guard.spec.ts`
    once `NEXT_PUBLIC_SUPABASE_URL` is set; all must pass.

## Deferred past merge

Recorded during review and left on purpose. Ordered by value.

- **Nested-root-layout refactor.** The custom 404 currently depends on
  `app/global-not-found.tsx` plus `experimental.globalNotFound: true`. A
  minimal root `app/layout.tsx` (html, body, fonts, globals.css) with
  `(site)/layout.tsx` and `admin/layout.tsx` as nested layouts removes the
  experimental flag and the metadata-orphaning class of bug that briefly
  dropped `og:image`. The e2e 404 test guards the current setup.
- **Alt text propagation.** Library alt text is the default copied into an
  entry when an image is picked; editing it later changes only the library.
  Either re-resolve alt at render from the `media` table or patch entries on
  `updateMediaAlt`. Documented for editors in the meantime.
- **`summariseProject`** exists as an action with no UI button. Wire it on the
  project editor or delete it.
- **Magic-link host pinning.** `sendMagicLink` derives the callback origin
  from request headers; Supabase's Redirect URL allowlist is the defence. Pin
  the host against `EDITOR_ORIGIN`/`PUBLIC_SITE_ORIGIN` to make it local.
- **`sendMagicLink` has no allowlist pre-check** and `shouldCreateUser: true`,
  so anyone reaching the editor login can have Supabase create a user and mail
  a link. Harmless past the door; bounded by Supabase send limits.
- **`content/faqs.ts`** still hard-codes the suburb; every other public surface
  reads settings.
- **`addressEffectiveMonth`** is time-dependent but rendered into pages cached
  with `revalidate: false`; the footer's "from October 2026" line drops on the
  next publish rather than on the date.
- **Test polish:** the `CmsImage` blur test asserts `backgroundSize: cover`
  rather than the forwarded `blurDataURL`; `clampMeta` does not strip a
  trailing full stop before the ellipsis; raw SDK error messages reach admins.
- **Editor polish:** field labels are raw schema keys; preview renders inside
  the admin layout, not the public one.
