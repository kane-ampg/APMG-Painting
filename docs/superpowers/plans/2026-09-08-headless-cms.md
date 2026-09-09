# Headless CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Farbod and Zac edit project and service copy, swap images, and publish blog posts from `/admin/`, with Claude drafting summaries and alt text, while the public site stays fully static and images load from a one-year CDN cache.

**Architecture:** Supabase (Postgres + Storage + Auth) holds content in one JSONB `content_entries` table plus a `media` table; Zod schemas at the boundary keep the existing `Project` / `Service` types unchanged. A content adapter in `lib/content/source.ts` reads Supabase behind `unstable_cache` tags and falls back to the TypeScript files when no database is configured. Saves call `updateTag` so the affected static pages rebuild on demand. Images are stored under immutable hashed names with a one-year `Cache-Control`, dimensions and a blur placeholder are computed once at upload with `sharp`, and `next/image` serves AVIF/WebP from Vercel's edge cache.

**Tech Stack:** Next.js 16 (App Router, `proxy.ts`, `unstable_cache`, `updateTag`), Supabase (`@supabase/supabase-js`, `@supabase/ssr`), `sharp`, `@anthropic-ai/sdk` (`claude-opus-5`, structured outputs), `react-markdown` + `remark-gfm`, Zod 3, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-08-headless-cms-design.md`

## Global Constraints

- Read `node_modules/next/dist/docs/` before using any Next API. This Next 16 differs from training data: `middleware.ts` is deprecated in favour of `proxy.ts`; `updateTag` exists alongside `revalidateTag`.
- Public site pages must remain statically generated. No page may become dynamic because of the CMS.
- The site is commercial only. `Audience` stays the one-member union `'commercial'`.
- Australian English in all UI copy and prompts. One company name: "APMG Painting".
- Never render an editorial placeholder as fact. `isPlaceholder` handling stays.
- `/admin/` is `noindex`, excluded from the sitemap, disallowed in robots.
- No service-role key at runtime. Only `scripts/seed-cms.mjs` uses it.
- Uploaded images are never overwritten. New content means a new object name.
- `npm run verify` (lint, typecheck, format, unit tests, build) must pass at the end of every task.
- Commit after every task. Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Model for all AI calls: `claude-opus-5`, exact string, no date suffix.
- Two Vercel projects from one repo (spec §8a). `NEXT_PUBLIC_APP_ROLE` is `site` or `editor`; unset means `site`. Nothing admin-related may be reachable on the `site` role, and nothing public may be reachable on the `editor` role.

---

## What editors can change, and where

| On the public site                                                                                                     | Edited at                  | Fields                                                           | Task    |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------- | ------- |
| Landing page → Services → "What we paint" cards (photo, title, summary, the four chips)                                | `/admin/services/<slug>/`  | `image`, `title`, `summary`, `includes` (first four chips shown) | 4, 6, 9 |
| Commercial and trade-services pages' service copy                                                                      | `/admin/services/<slug>/`  | `body`, `includes`, `image`                                      | 4, 9    |
| Project case studies, incl. hero and gallery photos                                                                    | `/admin/projects/<slug>/`  | all fields; `images` as a list                                   | 4, 6, 9 |
| Featured projects on the landing page                                                                                  | `/admin/projects/<slug>/`  | `isFeatured`                                                     | 4, 9    |
| Blog index and posts                                                                                                   | `/admin/posts/`            | all fields, Markdown body, AI summary                            | 10, 11  |
| Phone, email, address, move date, hours, ABN, socials, map pin (header, footer, contact, about, chat, structured data) | `/admin/settings/site/`    | see `SiteSettings`                                               | 12      |
| Contact page heading, lede, form heading and intro, meta                                                               | `/admin/pages/contact-us/` | see `ContactPageCopy`                                            | 12      |
| Every image's alt text                                                                                                 | `/admin/media/`            | `alt`, with "Describe with AI"                                   | 8, 10   |

Not editable in phase 1, by design: the section headings and intro paragraphs on the landing page ("What we paint", "Where we work most"), sector pages, suburb pages, FAQs, reviews, accreditations, company names. Adding a landing-page copy singleton later is the same shape as `pages/contact-us` and is a half-day task.

## File structure

```
supabase/
  migrations/0001_cms.sql          tables, RLS, storage bucket
lib/supabase/
  env.ts                           typed env access + hasSupabase()
  server.ts                        createServerClient for RSC / actions
  public.ts                        session-less client for the cached read path
lib/content/
  schemas.ts                       Zod schemas: Project, Service, Post, Media ref
  source.ts                        getProjects(), getServices(), getPosts(), get*BySlug()
  tags.ts                          contentTag('projects') helper
lib/media/
  process.ts                       dimensions, blur, sha256, object name
  url.ts                           publicUrlFor(storagePath) — single place a loader swap would touch
lib/auth/
  admin.ts                         requireAdmin() — session + allowlist
lib/ai/
  claude.ts                        Anthropic client + three typed generators
app/actions/
  content.ts                       saveEntry, publishEntry, deleteEntry
  media.ts                         uploadMedia, updateMediaAlt
  ai.ts                            draftPostSummary, describeImage, summariseProject
  auth.ts                          sendMagicLink, signOut
app/admin/
  layout.tsx                       noindex, shell, requireAdmin
  page.tsx                         dashboard
  login/page.tsx
  auth/callback/route.ts
  media/page.tsx
  [collection]/page.tsx            entry list
  [collection]/[slug]/page.tsx     editor
  preview/[collection]/[slug]/page.tsx
components/admin/
  entry-form.tsx                   schema-driven form
  media-picker.tsx
  ai-button.tsx
components/media/
  cms-image.tsx                    next/image wrapper taking a MediaRef
app/blog/
  page.tsx
  [slug]/page.tsx
proxy.ts                           session refresh + /admin redirect
lib/app-role.ts                    appRole(): 'site' | 'editor'
lib/revalidate/
  notify.ts                        notifyPublicSite({ tags, paths }) from the editor
app/api/revalidate/route.ts        public site: secret-checked revalidation endpoint
scripts/seed-cms.mjs               one-off: TS content + public/images → Supabase
```

---

### Task 1: Supabase project, env, clients, migration

**Files:**

- Create: `supabase/migrations/0001_cms.sql`
- Create: `lib/supabase/env.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/browser.ts`
- Modify: `.env.example`
- Test: `tests/unit/supabase-env.test.ts`

**Interfaces:**

- Produces: `hasSupabase(): boolean`, `supabaseEnv(): { url: string; anonKey: string }` (throws when unset), `createServerSupabase(): Promise<SupabaseClient>`, `createBrowserSupabase(): SupabaseClient`.

- [ ] **Step 1: Provision Supabase**

Run in the project root (installs the Vercel CLI if missing, then the marketplace integration):

```bash
npm i -g vercel
vercel link
vercel integration add supabase
vercel env pull .env.local
```

If the Marketplace route is unavailable, create the project at supabase.com and paste `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` into `.env.local` and the Vercel project by hand. Region: Sydney (`ap-southeast-2`).

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Write the failing env test**

`tests/unit/supabase-env.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('supabase env', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reports no Supabase when the URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { hasSupabase } = await import('@/lib/supabase/env');
    expect(hasSupabase()).toBe(false);
  });

  it('returns url and anon key when both are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    const { hasSupabase, supabaseEnv } = await import('@/lib/supabase/env');
    expect(hasSupabase()).toBe(true);
    expect(supabaseEnv()).toEqual({ url: 'https://abc.supabase.co', anonKey: 'anon' });
  });

  it('throws a readable error when asked for env that is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { supabaseEnv } = await import('@/lib/supabase/env');
    expect(() => supabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
```

- [ ] **Step 4: Run it, expect failure**

Run: `npx vitest run tests/unit/supabase-env.test.ts`
Expected: FAIL, cannot resolve `@/lib/supabase/env`.

- [ ] **Step 5: Implement env, server and browser clients**

`lib/supabase/env.ts`:

```ts
/**
 * Supabase configuration.
 *
 * Absence is a supported state: unit tests, the sandbox preview and a fresh
 * clone all run without a database and fall back to the TypeScript content
 * files. Presence is checked once here so no call site reads process.env.
 */
export function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  return { url, anonKey };
}

/** Storage host, used by next.config remotePatterns and lib/media/url.ts. */
export function supabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? new URL(url).hostname : null;
}
```

`lib/supabase/server.ts`:

```ts
import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseEnv } from './env';

/**
 * Per-request Supabase client for Server Components and Server Actions.
 * Carries the user's session cookie, so row level security applies. The
 * anon key is all it ever holds; write access comes from the session.
 */
export async function createServerSupabase() {
  const { url, anonKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there.
          // proxy.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
```

`lib/supabase/browser.ts`:

```ts
'use client';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseEnv } from './env';

export function createBrowserSupabase() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(url, anonKey);
}
```

- [ ] **Step 6: Write the migration**

`supabase/migrations/0001_cms.sql`:

```sql
-- Content -----------------------------------------------------------------
create table if not exists public.content_entries (
  collection  text not null check (collection in ('projects', 'services', 'posts', 'settings', 'pages')),
  slug        text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status      text not null default 'draft' check (status in ('draft', 'published')),
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text,
  primary key (collection, slug)
);

create table if not exists public.media (
  id             uuid primary key default gen_random_uuid(),
  storage_path   text not null unique,
  public_url     text not null,
  width          integer not null check (width > 0),
  height         integer not null check (height > 0),
  blur_data_url  text not null,
  alt            text not null default '',
  mime_type      text not null,
  bytes          integer not null,
  created_at     timestamptz not null default now(),
  created_by     text
);

create table if not exists public.admin_allowlist (
  email text primary key
);

-- Who may edit. Add editors here, never in code.
insert into public.admin_allowlist (email) values
  ('kaner@simple.biz')
on conflict do nothing;
-- TODO for the operator, not the code: add Farbod's and Zac's addresses with
-- the same statement once APMG confirms them.

-- Row level security --------------------------------------------------------
alter table public.content_entries enable row level security;
alter table public.media enable row level security;
alter table public.admin_allowlist enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_allowlist
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create policy "public reads published content"
  on public.content_entries for select
  using (status = 'published' or public.is_admin());

create policy "admins write content"
  on public.content_entries for all
  using (public.is_admin()) with check (public.is_admin());

create policy "public reads media"
  on public.media for select using (true);

create policy "admins write media"
  on public.media for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admins read allowlist"
  on public.admin_allowlist for select using (public.is_admin());

-- Storage -------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 15728640, array['image/webp','image/jpeg','image/png','image/avif'])
on conflict (id) do nothing;

create policy "public reads media objects"
  on storage.objects for select using (bucket_id = 'media');

create policy "admins upload media objects"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());

-- No update policy on purpose: objects are immutable. Replace = new object.
```

Apply it in the Supabase SQL editor, or with the CLI:

```bash
npx supabase db push
```

- [ ] **Step 7: Document env**

Append to `.env.example`:

```
# --- CMS (Supabase) ---------------------------------------------------
# Leave blank to run from the TypeScript content files with no database.
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
# Seed script only. Never read at runtime.
SUPABASE_SERVICE_ROLE_KEY=""
# AI assist in the admin. Blank disables the buttons.
ANTHROPIC_API_KEY=""
```

- [ ] **Step 8: Run tests, expect pass**

Run: `npx vitest run tests/unit/supabase-env.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add supabase lib/supabase tests/unit/supabase-env.test.ts .env.example package.json package-lock.json
git commit -m "feat(cms): add Supabase clients, env guard and schema migration"
```

---

### Task 2: Content schemas and the Post type

**Files:**

- Modify: `lib/content/types.ts`
- Create: `lib/content/schemas.ts`
- Test: `tests/unit/content-schemas.test.ts`

**Interfaces:**

- Produces: `MediaRef` type, `Post` type, `projectSchema`, `serviceSchema`, `postSchema`, `collectionSchemas`, `type Collection = 'projects' | 'services' | 'posts'`, `type EntryOf<C>`.
- Consumes: existing `Project`, `Service`, `Testimonial`, `EditorialPlaceholder` types.

- [ ] **Step 1: Write the failing test**

`tests/unit/content-schemas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { collectionSchemas, postSchema, projectSchema, serviceSchema } from '@/lib/content/schemas';
import { projects } from '@/content/projects';
import { services } from '@/content/services';

describe('content schemas', () => {
  it('accept every seeded project', () => {
    for (const project of projects) {
      const result = projectSchema.safeParse(project);
      expect(result.success, `project ${project.slug}: ${JSON.stringify(result)}`).toBe(true);
    }
  });

  it('accept every seeded service', () => {
    for (const service of services) {
      expect(serviceSchema.safeParse(service).success, service.slug).toBe(true);
    }
  });

  it('reject a project whose slug has capitals', () => {
    const bad = { ...projects[0], slug: 'Bad-Slug' };
    expect(projectSchema.safeParse(bad).success).toBe(false);
  });

  it('require a published post to carry a meta description under 160 chars', () => {
    const base = {
      slug: 'first-post',
      title: 'First post',
      excerpt: 'Short.',
      body: '# Hello',
      publishedAt: '2026-09-08',
      author: 'APMG Painting',
      tags: [],
      metaTitle: 'First post | APMG Painting',
      metaDescription: 'x'.repeat(161),
    };
    expect(postSchema.safeParse(base).success).toBe(false);
    expect(postSchema.safeParse({ ...base, metaDescription: 'Fine.' }).success).toBe(true);
  });

  it('exposes a schema for each content collection', () => {
    // Task 12 adds 'settings' and 'pages'; this stays true afterwards.
    expect(Object.keys(collectionSchemas)).toEqual(
      expect.arrayContaining(['posts', 'projects', 'services']),
    );
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run tests/unit/content-schemas.test.ts`
Expected: FAIL, cannot resolve `@/lib/content/schemas`.

- [ ] **Step 3: Add `MediaRef` and `Post` to types**

Append to `lib/content/types.ts`:

```ts
/**
 * A CMS-managed image. Width and height are stored at upload so pages can
 * reserve space before the bytes arrive; the blur is a 16px data URI.
 * `src` is the full public URL. The legacy `{ src, alt }` shape used by
 * services and projects is a structural subset, so a MediaRef can be passed
 * anywhere those are accepted.
 */
export type MediaRef = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
};

/** Blog post. Body is Markdown; rendering sanitises it. */
export type Post = {
  slug: string;
  title: string;
  /** Under 300 characters. Shown on the index and used as the OG description. */
  excerpt: string;
  body: string;
  cover?: MediaRef;
  /** ISO date. */
  publishedAt: string;
  /** ISO date, set on every save. Drives sitemap lastmod. */
  updatedAt?: string;
  author: string;
  tags: readonly string[];
  metaTitle: string;
  metaDescription: string;
};
```

- [ ] **Step 4: Write the schemas**

`lib/content/schemas.ts`:

```ts
import { z } from 'zod';
import type { Post, Project, Service } from './types';

/**
 * Validation at the CMS boundary. Every row read from Supabase and every
 * form submitted from /admin passes through one of these. They mirror
 * lib/content/types.ts field for field; the `satisfies` checks below make a
 * drift between the two a compile error.
 */

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase letters, digits and single hyphens');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');

export const mediaRefSchema = z.object({
  src: z.string().min(1),
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  blurDataURL: z.string().optional(),
});

const placeholderSchema = z.object({ __placeholder: z.literal(true), note: z.string() });

const testimonialSchema = z.object({
  quote: z.string().min(1),
  attribution: z.string().min(1),
  role: z.string().optional(),
  organisation: z.string().optional(),
});

export const projectSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  clientOrPropertyType: z.string().min(1),
  location: z.string().min(1),
  sectorSlug: slugSchema,
  initialCondition: z.string().optional(),
  challenge: z.string().min(1),
  scopeOfWork: z.array(z.string().min(1)),
  preparation: z.array(z.string().min(1)).optional(),
  coatingSystem: z.string().optional(),
  accessAndSafety: z.array(z.string().min(1)).optional(),
  schedulingConstraints: z.array(z.string().min(1)).optional(),
  duration: z.union([z.string(), placeholderSchema]).optional(),
  images: z.array(mediaRefSchema.extend({ phase: z.enum(['before', 'after']).optional() })),
  outcome: z.array(z.string().min(1)),
  testimonial: z.union([testimonialSchema, placeholderSchema]).optional(),
  relatedServiceSlugs: z.array(slugSchema),
  relatedLocationSlugs: z.array(slugSchema),
  isFeatured: z.boolean(),
});

export const serviceSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  audience: z.literal('commercial'),
  summary: z.string().min(1),
  body: z.array(z.string().min(1)),
  includes: z.array(z.string().min(1)),
  image: mediaRefSchema.optional(),
});

export const postSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(90),
  excerpt: z.string().min(1).max(300),
  body: z.string().min(1),
  cover: mediaRefSchema.optional(),
  publishedAt: isoDate,
  updatedAt: isoDate.optional(),
  author: z.string().min(1),
  tags: z.array(z.string().min(1)),
  metaTitle: z.string().min(1).max(70),
  metaDescription: z.string().min(1).max(160),
});

// Compile-time drift guards. If a type gains a field the schema lacks, or
// vice versa, one of these lines stops compiling.
type Mutable<T> = { -readonly [K in keyof T]: T[K] extends readonly (infer U)[] ? U[] : T[K] };
({}) as z.infer<typeof projectSchema> satisfies Mutable<Project>;
({}) as z.infer<typeof serviceSchema> satisfies Mutable<Service>;
({}) as z.infer<typeof postSchema> satisfies Mutable<Post>;

export const collectionSchemas = {
  projects: projectSchema,
  services: serviceSchema,
  posts: postSchema,
} as const;

export type Collection = keyof typeof collectionSchemas;
export type EntryOf<C extends Collection> = z.infer<(typeof collectionSchemas)[C]>;

export const collections = Object.keys(collectionSchemas) as Collection[];

export function isCollection(value: string): value is Collection {
  return value in collectionSchemas;
}
```

Note on the drift guards: the `satisfies` lines are expressions with no runtime effect. If `tsc` rejects the `Mutable` mapping on nested readonly arrays, replace the three guard lines with explicit `const _p: Project = {} as z.infer<typeof projectSchema>;` style assignments. Either way the point is a compile error on drift.

- [ ] **Step 5: Run tests, expect pass**

Run: `npx vitest run tests/unit/content-schemas.test.ts && npm run typecheck`
Expected: PASS (5 tests), typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add lib/content/types.ts lib/content/schemas.ts tests/unit/content-schemas.test.ts
git commit -m "feat(cms): add Zod content schemas and the Post type"
```

---

### Task 3: Content source adapter with cache tags and fallback

**Files:**

- Create: `lib/content/tags.ts`
- Create: `lib/content/source.ts`
- Test: `tests/unit/content-source.test.ts`

**Interfaces:**

- Produces: `contentTag(c: Collection): string` (returns `content:<c>`); `getProjects(): Promise<Project[]>`, `getProject(slug): Promise<Project | undefined>`, `getFeaturedProjects()`, `getProjectsForSector(sectorSlug)`, `getServices()`, `getService(slug)`, `getPosts()`, `getPost(slug)`, `getEntryForPreview(collection, slug)` (drafts included, uncached). Task 12 extends this file with `getSiteSettings()` and `getPage(slug)` using the same `all()` helper, so keep `seeds` and `all` generic over `Collection`.
- Consumes: `collectionSchemas`, `hasSupabase`, `createServerSupabase`, TS arrays in `content/*.ts`.

- [ ] **Step 1: Write the failing test**

`tests/unit/content-source.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

describe('content source without Supabase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('falls back to the TypeScript projects', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { getProjects, getProject } = await import('@/lib/content/source');
    const { projects } = await import('@/content/projects');
    expect(await getProjects()).toEqual(projects);
    expect((await getProject(projects[0].slug))?.title).toBe(projects[0].title);
  });

  it('returns no posts when there is no database', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { getPosts } = await import('@/lib/content/source');
    expect(await getPosts()).toEqual([]);
  });

  it('names one tag per collection', async () => {
    const { contentTag } = await import('@/lib/content/tags');
    expect(contentTag('projects')).toBe('content:projects');
  });
});

describe('content source with Supabase', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock('@/lib/supabase/server');
  });

  it('parses published rows and drops rows that fail the schema', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    const rows = [
      {
        slug: 'first-post',
        status: 'published',
        data: {
          slug: 'first-post',
          title: 'First post',
          excerpt: 'Short.',
          body: '# Hello',
          publishedAt: '2026-09-08',
          author: 'APMG Painting',
          tags: [],
          metaTitle: 'First post',
          metaDescription: 'Fine.',
        },
      },
      { slug: 'broken', status: 'published', data: { slug: 'broken' } },
    ];
    vi.doMock('@/lib/supabase/server', () => ({
      createServerSupabase: async () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({ order: async () => ({ data: rows, error: null }) }),
            }),
          }),
        }),
      }),
    }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getPosts } = await import('@/lib/content/source');
    const posts = await getPosts();
    expect(posts.map((p) => p.slug)).toEqual(['first-post']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('broken'), expect.anything());
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run tests/unit/content-source.test.ts`
Expected: FAIL, cannot resolve `@/lib/content/source`.

- [ ] **Step 3: Implement tags and source**

`lib/content/tags.ts`:

```ts
import type { Collection } from './schemas';

/** Cache tag per collection. Saves call updateTag(contentTag(c)). */
export function contentTag(collection: Collection): string {
  return `content:${collection}`;
}
```

`lib/content/source.ts`:

```ts
import { unstable_cache } from 'next/cache';
import { hasSupabase } from '@/lib/supabase/env';
import { collectionSchemas, type Collection, type EntryOf } from './schemas';
import { contentTag } from './tags';
import type { Post, Project, Service } from './types';
import { projects as seedProjects } from '@/content/projects';
import { services as seedServices } from '@/content/services';

/**
 * The content adapter.
 *
 * Every page reads through here. With Supabase configured, rows come from
 * `content_entries` behind a cache tagged per collection and never expiring
 * on a timer: the admin save action expires it. Without Supabase, the
 * TypeScript files answer, so tests, the sandbox and a fresh clone need no
 * database.
 */

const seeds: { [C in Collection]: readonly EntryOf<C>[] } = {
  projects: seedProjects as readonly EntryOf<'projects'>[],
  services: seedServices as readonly EntryOf<'services'>[],
  posts: [],
};

type Row = { slug: string; status: 'draft' | 'published'; data: unknown };

function parseRows<C extends Collection>(collection: C, rows: Row[]): EntryOf<C>[] {
  const schema = collectionSchemas[collection];
  const out: EntryOf<C>[] = [];
  for (const row of rows) {
    const result = schema.safeParse(row.data);
    if (result.success) out.push(result.data as EntryOf<C>);
    else
      console.warn(`[content] ${collection}/${row.slug} failed validation`, result.error.flatten());
  }
  return out;
}

async function fetchPublished<C extends Collection>(collection: C): Promise<EntryOf<C>[]> {
  const { createServerSupabase } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('content_entries')
    .select('slug, status, data')
    .eq('collection', collection)
    .eq('status', 'published')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`[content] ${collection}: ${error.message}`);
  return parseRows(collection, (data ?? []) as Row[]);
}

function cachedCollection<C extends Collection>(collection: C) {
  return unstable_cache(() => fetchPublished(collection), ['content', collection], {
    tags: [contentTag(collection)],
    revalidate: false,
  });
}

async function all<C extends Collection>(collection: C): Promise<EntryOf<C>[]> {
  if (!hasSupabase()) return [...seeds[collection]];
  return cachedCollection(collection)();
}

// --- Projects --------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  return all('projects');
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return (await getProjects()).find((p) => p.slug === slug);
}

export async function getFeaturedProjects(): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.isFeatured);
}

export async function getProjectsForSector(sectorSlug: string): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.sectorSlug === sectorSlug);
}

// --- Services --------------------------------------------------------------

export async function getServices(): Promise<Service[]> {
  return all('services');
}

export async function getService(slug: string): Promise<Service | undefined> {
  return (await getServices()).find((s) => s.slug === slug);
}

// --- Posts -----------------------------------------------------------------

export async function getPosts(): Promise<Post[]> {
  const posts = await all('posts');
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getPosts()).find((p) => p.slug === slug);
}

// --- Admin -----------------------------------------------------------------

/** Uncached. Includes drafts. Only the admin preview and editor call this. */
export async function getEntryForPreview<C extends Collection>(
  collection: C,
  slug: string,
): Promise<{ status: 'draft' | 'published'; data: EntryOf<C> } | undefined> {
  if (!hasSupabase()) {
    const seed = seeds[collection].find((e) => e.slug === slug);
    return seed ? { status: 'published', data: seed as EntryOf<C> } : undefined;
  }
  const { createServerSupabase } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('content_entries')
    .select('slug, status, data')
    .eq('collection', collection)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`[content] ${collection}/${slug}: ${error.message}`);
  if (!data) return undefined;
  const parsed = collectionSchemas[collection].safeParse(data.data);
  if (!parsed.success) return undefined;
  return { status: data.status as 'draft' | 'published', data: parsed.data as EntryOf<C> };
}
```

- [ ] **Step 4: Run tests, expect pass**

Run: `npx vitest run tests/unit/content-source.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/content/tags.ts lib/content/source.ts tests/unit/content-source.test.ts
git commit -m "feat(cms): add content source adapter with cache tags and TS fallback"
```

---

### Task 4: Move pages onto the adapter

**Files:**

- Modify: `app/page.tsx`, `app/commercial/page.tsx`, `app/office-painters/page.tsx`, `app/trade-services/page.tsx`, `app/projects/page.tsx`, `app/projects/[slug]/page.tsx`, `app/[sector]/page.tsx`, `app/areas/[slug]/page.tsx`, `app/sitemap.ts`, `app/llms.txt/route.ts`, `lib/schema/index.ts`
- Modify: `next.config.ts`
- Test: existing `tests/unit/schema.test.ts`, `tests/unit/content-integrity.test.ts`, e2e suites

**Interfaces:**

- Consumes: `getProjects`, `getProject`, `getFeaturedProjects`, `getProjectsForSector`, `getServices`, `getService` from Task 3.
- Leaves untouched: `content/sectors.ts`, `content/locations.ts`, `components/navigation/nav-data.ts` (sectors stay synchronous per spec §2).

- [ ] **Step 1: Find every synchronous import**

Run:

```bash
grep -rn "from '@/content/projects'\|from '@/content/services'" app components lib
```

Expected hits are the eleven files listed above. `content/*.ts` themselves and `tests/` keep importing the arrays directly.

- [ ] **Step 2: Rewrite each page to await the adapter**

Pattern, applied to every hit. Before:

```ts
import { getProject, projects } from '@/content/projects';
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}
export const dynamicParams = false;
```

After:

```ts
import { getProject, getProjects } from '@/lib/content/source';
export async function generateStaticParams() {
  return (await getProjects()).map((project) => ({ slug: project.slug }));
}
// A project published from the CMS after the last build renders on first
// request, then is cached like the rest.
export const dynamicParams = true;
```

Inside components, `const project = getProject(slug)` becomes `const project = await getProject(slug)`. Components that were synchronous become `async function`. `featuredProjects` becomes `await getFeaturedProjects()`; `projectsForSector(x)` becomes `await getProjectsForSector(x)`; `services` becomes `await getServices()`.

`lib/schema/index.ts` currently imports `services` at module scope for `localBusinessSchema`. Change `localBusinessSchema()` to accept the list: `localBusinessSchema(services: readonly Service[])`, and update its two callers (`app/layout.tsx` or wherever `JsonLd data={localBusinessSchema()}` is rendered, and `tests/unit/schema.test.ts`, which should pass the seed `services` array). Do the same for any other schema builder that reads `projects` or `services` at module scope.

`app/llms.txt/route.ts` keeps `export const dynamic = 'force-static'` and awaits the adapter inside the handler.

- [ ] **Step 3: Allow the Supabase host for next/image**

In `next.config.ts` replace the `images` block:

```ts
import { supabaseHostname } from './lib/supabase/env';

const supabaseHost = supabaseHostname();

// ...
  images: {
    formats: ['image/avif', 'image/webp'],
    // Source objects are immutable (hashed names, one-year Cache-Control),
    // so the optimised variants can be cached for the same year.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apmgpainting.com.au',
        pathname: '/wp-content/uploads/**',
      },
      ...(supabaseHost
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHost,
              pathname: '/storage/v1/object/public/media/**',
            },
          ]
        : []),
    ],
  },
```

`lib/supabase/env.ts` must stay free of `server-only` and Next imports so `next.config.ts` can load it.

- [ ] **Step 4: Verify**

Run: `npm run verify`
Expected: lint, typecheck, format, unit tests and build all pass with `NEXT_PUBLIC_SUPABASE_URL` unset (fallback path). Then with `.env.local` populated, run `npm run build` again and confirm the build log lists every project and sector page as static (`○` or `●`), none as `ƒ`.

Run: `npm run test:e2e`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app lib next.config.ts tests
git commit -m "refactor: read projects and services through the content adapter"
```

---

### Task 5: Media processing and the seed script

**Files:**

- Create: `lib/media/process.ts`
- Create: `lib/media/url.ts`
- Create: `scripts/seed-cms.mjs`
- Test: `tests/unit/media-process.test.ts`

**Interfaces:**

- Produces: `processImage(buffer: Buffer, originalName: string, folder: string): Promise<ProcessedImage>` where `ProcessedImage = { storagePath: string; width: number; height: number; blurDataURL: string; mimeType: string; bytes: number }`; `objectName(sha256Hex: string, originalName: string, folder: string): string`; `publicUrlFor(storagePath: string): string`.
- Consumes: `supabaseEnv`.

- [ ] **Step 1: Install sharp**

```bash
npm install sharp
```

- [ ] **Step 2: Write the failing test**

`tests/unit/media-process.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { objectName, processImage } from '@/lib/media/process';

describe('media processing', () => {
  it('builds an immutable, slugified object name', () => {
    expect(objectName('3f9a2c7d00', 'Noble Park FACTORY 01.WEBP', 'projects')).toBe(
      'projects/3f9a2c-noble-park-factory-01.webp',
    );
  });

  it('reads dimensions and produces a small blur data URI', async () => {
    const png = await sharp({
      create: { width: 640, height: 360, channels: 3, background: '#336699' },
    })
      .png()
      .toBuffer();
    const result = await processImage(png, 'test.png', 'work');
    expect(result.width).toBe(640);
    expect(result.height).toBe(360);
    expect(result.mimeType).toBe('image/png');
    expect(result.storagePath).toMatch(/^work\/[0-9a-f]{6}-test\.png$/);
    expect(result.blurDataURL.startsWith('data:image/webp;base64,')).toBe(true);
    expect(result.blurDataURL.length).toBeLessThan(1500);
  });

  it('rejects anything that is not an image', async () => {
    await expect(processImage(Buffer.from('hello'), 'x.txt', 'work')).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run it, expect failure**

Run: `npx vitest run tests/unit/media-process.test.ts`
Expected: FAIL, cannot resolve `@/lib/media/process`.

- [ ] **Step 4: Implement**

`lib/media/process.ts`:

```ts
import { createHash } from 'node:crypto';
import sharp from 'sharp';

export type ProcessedImage = {
  storagePath: string;
  width: number;
  height: number;
  blurDataURL: string;
  mimeType: string;
  bytes: number;
};

const MIME: Record<string, string> = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  avif: 'image/avif',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * `<folder>/<6 hex of sha256>-<slug>.<ext>`.
 *
 * The hash prefix makes the name a function of the bytes, so the same file
 * uploaded twice lands on the same object (the bucket rejects the second
 * insert, harmlessly) and a changed file always gets a new URL. That is what
 * lets both Supabase and Vercel cache for a year with no busting.
 */
export function objectName(sha256Hex: string, originalName: string, folder: string): string {
  const dot = originalName.lastIndexOf('.');
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  const ext = dot > 0 ? originalName.slice(dot + 1).toLowerCase() : 'bin';
  return `${folder}/${sha256Hex.slice(0, 6)}-${slugify(base)}.${ext}`;
}

export async function processImage(
  buffer: Buffer,
  originalName: string,
  folder: string,
): Promise<ProcessedImage> {
  const image = sharp(buffer);
  const meta = await image.metadata();
  if (!meta.width || !meta.height || !meta.format || !(meta.format in MIME)) {
    throw new Error(`Unsupported image: ${originalName}`);
  }

  const blur = await sharp(buffer).resize(16).webp({ quality: 40 }).toBuffer();
  const sha = createHash('sha256').update(buffer).digest('hex');

  return {
    storagePath: objectName(sha, originalName, folder),
    width: meta.width,
    height: meta.height,
    blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
    mimeType: MIME[meta.format],
    bytes: buffer.byteLength,
  };
}
```

`lib/media/url.ts`:

```ts
import { supabaseEnv } from '@/lib/supabase/env';

/**
 * The one place a storage path becomes a URL. Switching to Supabase Image
 * Transformations later (spec §4) means changing this function and adding a
 * next/image loader; nothing else moves.
 */
export function publicUrlFor(storagePath: string): string {
  const { url } = supabaseEnv();
  return `${url}/storage/v1/object/public/media/${storagePath}`;
}
```

- [ ] **Step 5: Run tests, expect pass**

Run: `npx vitest run tests/unit/media-process.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Write the seed script**

`scripts/seed-cms.mjs`:

```js
/**
 * One-off seed: pushes the TypeScript content and public/images into
 * Supabase. Idempotent — re-running upserts entries and skips objects that
 * already exist. Needs SUPABASE_SERVICE_ROLE_KEY; this is the only place it
 * is ever used.
 *
 * Run: node --env-file=.env.local scripts/seed-cms.mjs
 */
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Load the TS content through tsx so the arrays are the single source.
register('tsx/esm', pathToFileURL('./'));
const { projects } = await import('../content/projects.ts');
const { services } = await import('../content/services.ts');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(url, key, { auth: { persistSession: false } });

const MIME = { webp: 'image/webp', jpeg: 'image/jpeg', png: 'image/png', avif: 'image/avif' };
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Uploads one local file, returns a MediaRef. Caches by local path. */
const uploaded = new Map();
async function uploadLocal(localSrc, alt) {
  if (uploaded.has(localSrc)) return { ...uploaded.get(localSrc), alt };
  const file = path.join('public', localSrc);
  const buffer = await readFile(file);
  const meta = await sharp(buffer).metadata();
  const sha = createHash('sha256').update(buffer).digest('hex');
  const folder = localSrc.split('/')[2]; // /images/<folder>/name
  const base = path.basename(localSrc, path.extname(localSrc));
  const ext = path.extname(localSrc).slice(1).toLowerCase();
  const storagePath = `${folder}/${sha.slice(0, 6)}-${slugify(base)}.${ext}`;
  const blur = await sharp(buffer).resize(16).webp({ quality: 40 }).toBuffer();

  const { error: upErr } = await supabase.storage.from('media').upload(storagePath, buffer, {
    contentType: MIME[meta.format],
    cacheControl: '31536000',
    upsert: false,
  });
  if (upErr && !/already exists/i.test(upErr.message)) throw upErr;

  const publicUrl = `${url}/storage/v1/object/public/media/${storagePath}`;
  const { error: rowErr } = await supabase.from('media').upsert(
    {
      storage_path: storagePath,
      public_url: publicUrl,
      width: meta.width,
      height: meta.height,
      blur_data_url: `data:image/webp;base64,${blur.toString('base64')}`,
      alt,
      mime_type: MIME[meta.format],
      bytes: buffer.byteLength,
      created_by: 'seed',
    },
    { onConflict: 'storage_path' },
  );
  if (rowErr) throw rowErr;

  const ref = {
    src: publicUrl,
    width: meta.width,
    height: meta.height,
    blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
  };
  uploaded.set(localSrc, ref);
  console.log('media', storagePath);
  return { ...ref, alt };
}

async function upsertEntry(collection, slug, data) {
  const { error } = await supabase
    .from('content_entries')
    .upsert(
      { collection, slug, status: 'published', data, updated_by: 'seed' },
      { onConflict: 'collection,slug' },
    );
  if (error) throw error;
  console.log(collection, slug);
}

for (const project of projects) {
  const images = [];
  for (const image of project.images) {
    images.push({ ...(await uploadLocal(image.src, image.alt)), phase: image.phase });
  }
  await upsertEntry('projects', project.slug, { ...project, images });
}

for (const service of services) {
  const image = service.image ? await uploadLocal(service.image.src, service.image.alt) : undefined;
  await upsertEntry('services', service.slug, { ...service, image });
}

console.log('Seed complete.');
```

Install the loader it needs: `npm install -D tsx`.

- [ ] **Step 7: Run the seed against the real project**

```bash
node --env-file=.env.local scripts/seed-cms.mjs
```

Expected: one `media` line per image under `public/images/projects` and `public/images/work`, one line per project and service, then `Seed complete.`. Re-running prints the same lines and finishes without error.

Then `npm run build` with `.env.local` present, and open a project page: the hero `<img>` must point at `/_next/image?url=https%3A%2F%2F<ref>.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fmedia%2F...`.

- [ ] **Step 8: Commit**

```bash
git add lib/media scripts/seed-cms.mjs tests/unit/media-process.test.ts package.json package-lock.json
git commit -m "feat(cms): add image processing and the Supabase seed script"
```

---

### Task 6: CMS image component

**Files:**

- Create: `components/media/cms-image.tsx`
- Modify: `app/projects/[slug]/page.tsx` (hero and gallery), `components/sections/index.tsx` (wherever a service `image` or project cover renders)
- Test: `tests/unit/cms-image.test.tsx`

**Interfaces:**

- Produces: `<CmsImage image={MediaRef} sizes priority? fill? className? />`.
- Consumes: `MediaRef` from Task 2.

- [ ] **Step 1: Write the failing test**

`tests/unit/cms-image.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CmsImage } from '@/components/media/cms-image';

describe('CmsImage', () => {
  it('passes stored dimensions and blur through to next/image', () => {
    const { container } = render(
      <CmsImage
        image={{
          src: '/images/work/x.webp',
          alt: 'A wall',
          width: 1600,
          height: 900,
          blurDataURL: 'data:image/webp;base64,AAAA',
        }}
        sizes="100vw"
      />,
    );
    const img = container.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('A wall');
    expect(img.getAttribute('width')).toBe('1600');
    expect(img.getAttribute('height')).toBe('900');
    expect(img.style.backgroundImage).toContain('data:image/webp;base64,AAAA');
  });

  it('falls back to fill layout when dimensions are unknown', () => {
    const { container } = render(
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <CmsImage image={{ src: '/images/work/x.webp', alt: 'A wall' }} sizes="100vw" />
      </div>,
    );
    const img = container.querySelector('img')!;
    expect(img.getAttribute('width')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run tests/unit/cms-image.test.tsx`
Expected: FAIL, cannot resolve `@/components/media/cms-image`.

- [ ] **Step 3: Implement**

`components/media/cms-image.tsx`:

```tsx
import Image from 'next/image';
import type { MediaRef } from '@/lib/content/types';

type Props = {
  image: MediaRef;
  /** Required. A wrong `sizes` downloads the wrong file and costs LCP. */
  sizes: string;
  priority?: boolean;
  /** Force fill layout even when dimensions are known (aspect-ratio boxes). */
  fill?: boolean;
  className?: string;
};

/**
 * next/image with the CMS's stored metadata applied.
 *
 * Width, height and blur come from the `media` row written at upload, so the
 * browser reserves the box before the bytes arrive (no CLS) and paints a
 * blur immediately. Seeded legacy `{src, alt}` images have no dimensions
 * and render in fill mode inside their existing aspect-ratio containers.
 */
export function CmsImage({ image, sizes, priority = false, fill = false, className }: Props) {
  const hasBlur = Boolean(image.blurDataURL);
  const useFill = fill || !image.width || !image.height;

  if (useFill) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder={hasBlur ? 'blur' : 'empty'}
        blurDataURL={image.blurDataURL}
        className={className}
      />
    );
  }

  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      priority={priority}
      placeholder={hasBlur ? 'blur' : 'empty'}
      blurDataURL={image.blurDataURL}
      className={className}
    />
  );
}
```

- [ ] **Step 4: Use it on the project page**

In `app/projects/[slug]/page.tsx` replace the hero `<Image ... />` block with:

```tsx
<CmsImage image={cover} fill priority sizes="100vw" className={`object-cover ${mediaZoom}`} />
```

and each gallery `<Image>` with `<CmsImage image={img} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />`.

In `components/sections/index.tsx`, `ServiceGrid` renders the landing page's "What we paint" cards. Replace its `<Image ... />` with:

```tsx
<CmsImage
  image={service.image}
  fill
  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
  className={`object-cover ${mediaZoom}`}
/>
```

Keep the `service.image &&` guard: a service without a photo still renders as a plain card. These cards are not `priority`; they sit below the hero and stay lazy.

- [ ] **Step 5: Run tests and verify**

Run: `npx vitest run tests/unit/cms-image.test.tsx && npm run verify`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/media/cms-image.tsx app/projects components/sections tests/unit/cms-image.test.tsx
git commit -m "feat(cms): render CMS images with stored dimensions and blur"
```

---

### Task 7: Auth — proxy, login, allowlist

**Files:**

- Create: `proxy.ts`
- Create: `lib/auth/admin.ts`
- Create: `app/actions/auth.ts`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/auth/callback/route.ts`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Modify: `app/robots.ts`, `app/sitemap.ts` (no change needed if admin never listed; confirm)
- Test: `tests/unit/admin-auth.test.ts`, `tests/e2e/admin-guard.spec.ts`

**Interfaces:**

- Produces: `requireAdmin(): Promise<{ email: string }>` (redirects to `/admin/login/` when not signed in, throws `AdminForbiddenError` when signed in but not allowlisted); `sendMagicLink(formData)`, `signOut()` server actions.

- [ ] **Step 1: Write the failing unit test**

`tests/unit/admin-auth.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const redirect = vi.fn((to: string) => {
  throw new Error(`REDIRECT:${to}`);
});
vi.mock('next/navigation', () => ({ redirect: (to: string) => redirect(to) }));

function mockSupabase(user: { email: string } | null, allowlisted: boolean) {
  vi.doMock('@/lib/supabase/server', () => ({
    createServerSupabase: async () => ({
      auth: { getUser: async () => ({ data: { user }, error: null }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: allowlisted ? { email: user?.email } : null }),
          }),
        }),
      }),
    }),
  }));
}

describe('requireAdmin', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/lib/supabase/server');
    redirect.mockClear();
  });

  it('redirects to login when signed out', async () => {
    mockSupabase(null, false);
    const { requireAdmin } = await import('@/lib/auth/admin');
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/admin/login/');
  });

  it('forbids a signed-in user who is not on the allowlist', async () => {
    mockSupabase({ email: 'someone@example.com' }, false);
    const { requireAdmin, AdminForbiddenError } = await import('@/lib/auth/admin');
    await expect(requireAdmin()).rejects.toBeInstanceOf(AdminForbiddenError);
  });

  it('returns the email for an allowlisted user', async () => {
    mockSupabase({ email: 'kaner@simple.biz' }, true);
    const { requireAdmin } = await import('@/lib/auth/admin');
    await expect(requireAdmin()).resolves.toEqual({ email: 'kaner@simple.biz' });
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run tests/unit/admin-auth.test.ts`
Expected: FAIL, cannot resolve `@/lib/auth/admin`.

- [ ] **Step 3: Implement the guard**

`lib/auth/admin.ts`:

```ts
import 'server-only';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export class AdminForbiddenError extends Error {
  constructor(email: string) {
    super(`${email} is signed in but not on the admin allowlist`);
  }
}

/**
 * Two checks, both server-side, on every admin render and every action:
 * a live Supabase session, and membership of `admin_allowlist`. The RLS
 * policies enforce the same rule in the database, so this is the friendly
 * error, not the security boundary.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect('/admin/login/');

  const email = user.email.toLowerCase();
  const { data } = await supabase
    .from('admin_allowlist')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  if (!data) throw new AdminForbiddenError(email);
  return { email };
}
```

- [ ] **Step 4: Session refresh in proxy.ts**

`proxy.ts` (project root, next to `next.config.ts`):

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hasSupabase, supabaseEnv } from '@/lib/supabase/env';

/**
 * Keeps the Supabase session cookie fresh and bounces anonymous visitors
 * off /admin. Public routes are never touched: the matcher below is the
 * whole story, and the public site stays static.
 */
export async function proxy(request: NextRequest) {
  if (!hasSupabase()) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = supabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/auth/');
  if (!user && !isLogin) {
    return NextResponse.redirect(new URL('/admin/login/', request.url));
  }
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

- [ ] **Step 5: Login page, actions and callback**

`app/actions/auth.ts`:

```ts
'use server';

import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/site';

export type AuthState = { status: 'idle' | 'sent' | 'error'; message?: string };

export async function sendMagicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}/admin/auth/callback/`, shouldCreateUser: true },
  });
  if (error) return { status: 'error', message: 'Could not send the link. Try again in a minute.' };
  return { status: 'sent', message: `Check ${email} for a sign-in link.` };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/admin/login/');
}
```

`app/admin/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/admin/', request.url));
  }
  return NextResponse.redirect(new URL('/admin/login/?error=link', request.url));
}
```

`app/admin/login/page.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { sendMagicLink, type AuthState } from '@/app/actions/auth';

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(sendMagicLink, {
    status: 'idle',
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="font-display text-2xl tracking-tight">APMG Painting — editor sign in</h1>
      <form action={action} className="flex flex-col gap-3">
        <label className="text-sm font-medium" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-paper-edge px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-brand-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>
      {state.message && (
        <p role="status" className={state.status === 'error' ? 'text-red-700' : 'text-ink-soft'}>
          {state.message}
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 6: Admin layout and dashboard**

`app/admin/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { signOut } from '@/app/actions/auth';

export const metadata: Metadata = {
  title: 'APMG editor',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

/**
 * The admin shell. Auth is enforced per page via requireAdmin() rather than
 * here, because the login page shares this layout.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-paper-edge px-6 py-3 text-sm">
        <nav className="flex gap-4">
          <Link href="/admin/">Dashboard</Link>
          <Link href="/admin/projects/">Projects</Link>
          <Link href="/admin/services/">Services</Link>
          <Link href="/admin/posts/">Blog</Link>
          <Link href="/admin/media/">Media</Link>
        </nav>
        <form action={signOut}>
          <button type="submit" className="underline">
            Sign out
          </button>
        </form>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
```

`app/admin/page.tsx`:

```tsx
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';
import { collections } from '@/lib/content/schemas';

export default async function AdminHome() {
  const { email } = await requireAdmin();
  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">Signed in as {email}</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {collections.map((c) => (
          <li key={c}>
            <Link
              href={`/admin/${c}/`}
              className="block rounded border border-paper-edge p-4 capitalize"
            >
              {c}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/admin/media/" className="block rounded border border-paper-edge p-4">
            Media library
          </Link>
        </li>
      </ul>
    </>
  );
}
```

Add an `app/admin/error.tsx` client component that renders "This account is not an APMG editor. Ask Kane to add you." when `error.message` contains "allowlist", and a generic message otherwise.

- [ ] **Step 7: Robots**

In `app/robots.ts`, change both `disallow: ['/api/']` entries to `disallow: ['/api/', '/admin/']`. Confirm `app/sitemap.ts` lists no admin path (it builds from explicit lists, so nothing to change).

- [ ] **Step 8: E2E guard**

`tests/e2e/admin-guard.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('anonymous /admin redirects to login', async ({ page }) => {
  await page.goto('/admin/');
  await expect(page).toHaveURL(/\/admin\/login\/?$/);
  await expect(page.getByRole('heading', { name: /editor sign in/i })).toBeVisible();
});

test('admin pages are noindex', async ({ page }) => {
  await page.goto('/admin/login/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
```

(When `NEXT_PUBLIC_SUPABASE_URL` is unset, `proxy.ts` redirects `/admin` to `/`; the e2e run needs `.env.local` populated. Document that at the top of the spec file in a comment.)

- [ ] **Step 9: Verify**

Run: `npx vitest run tests/unit/admin-auth.test.ts && npm run verify && npm run test:e2e`
Expected: PASS. Manually: visit `/admin/`, request a link to `kaner@simple.biz`, click it, land on the dashboard. Add a test address not in the allowlist and confirm the forbidden message.

In the Supabase dashboard, Authentication → URL Configuration: set Site URL to the production origin and add `http://localhost:3000/admin/auth/callback/` plus the Vercel preview pattern `https://*-<team>.vercel.app/admin/auth/callback/` to Redirect URLs.

- [ ] **Step 10: Commit**

```bash
git add proxy.ts lib/auth app/actions/auth.ts app/admin app/robots.ts tests/unit/admin-auth.test.ts tests/e2e/admin-guard.spec.ts
git commit -m "feat(cms): add magic-link admin auth behind proxy and allowlist"
```

---

### Task 8: Media library — upload action and page

**Files:**

- Create: `app/actions/media.ts`
- Create: `app/admin/media/page.tsx`
- Create: `components/admin/media-upload.tsx`
- Test: `tests/unit/media-actions.test.ts`

**Interfaces:**

- Produces: `uploadMedia(prev, formData): Promise<MediaActionState>`; `updateMediaAlt(id: string, alt: string): Promise<void>`; `listMedia(): Promise<MediaRow[]>` where `MediaRow = { id: string; storage_path: string; public_url: string; width: number; height: number; blur_data_url: string; alt: string; created_at: string }`; `toMediaRef(row: MediaRow): MediaRef`.
- Consumes: `processImage` (Task 5), `publicUrlFor` (Task 5), `requireAdmin` (Task 7).

- [ ] **Step 1: Write the failing test**

`tests/unit/media-actions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toMediaRef } from '@/app/actions/media';

describe('toMediaRef', () => {
  it('maps a media row onto the MediaRef the pages consume', () => {
    expect(
      toMediaRef({
        id: 'x',
        storage_path: 'work/abc123-wall.webp',
        public_url: 'https://abc.supabase.co/storage/v1/object/public/media/work/abc123-wall.webp',
        width: 1600,
        height: 900,
        blur_data_url: 'data:image/webp;base64,AAAA',
        alt: 'A wall',
        created_at: '2026-09-08T00:00:00Z',
      }),
    ).toEqual({
      src: 'https://abc.supabase.co/storage/v1/object/public/media/work/abc123-wall.webp',
      alt: 'A wall',
      width: 1600,
      height: 900,
      blurDataURL: 'data:image/webp;base64,AAAA',
    });
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run tests/unit/media-actions.test.ts`
Expected: FAIL, cannot resolve `@/app/actions/media`.

- [ ] **Step 3: Implement the actions**

`app/actions/media.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import type { MediaRef } from '@/lib/content/types';
import { processImage } from '@/lib/media/process';
import { publicUrlFor } from '@/lib/media/url';
import { createServerSupabase } from '@/lib/supabase/server';

export type MediaRow = {
  id: string;
  storage_path: string;
  public_url: string;
  width: number;
  height: number;
  blur_data_url: string;
  alt: string;
  created_at: string;
};

export type MediaActionState = { status: 'idle' | 'ok' | 'error'; message?: string };

const MAX_BYTES = 15 * 1024 * 1024;
const FOLDERS = new Set(['projects', 'work', 'blog', 'hero']);

export function toMediaRef(row: MediaRow): MediaRef {
  return {
    src: row.public_url,
    alt: row.alt,
    width: row.width,
    height: row.height,
    blurDataURL: row.blur_data_url,
  };
}

export async function listMedia(): Promise<MediaRow[]> {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('media')
    .select('id, storage_path, public_url, width, height, blur_data_url, alt, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MediaRow[];
}

export async function uploadMedia(
  _prev: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  const { email } = await requireAdmin();
  const file = formData.get('file');
  const folder = String(formData.get('folder') ?? 'work');
  const alt = String(formData.get('alt') ?? '').trim();

  if (!(file instanceof File) || file.size === 0)
    return { status: 'error', message: 'Choose an image.' };
  if (file.size > MAX_BYTES) return { status: 'error', message: 'Images must be under 15 MB.' };
  if (!FOLDERS.has(folder)) return { status: 'error', message: 'Unknown folder.' };
  if (!alt)
    return { status: 'error', message: 'Alt text is required. Use "Describe with AI" if stuck.' };

  let processed;
  try {
    processed = await processImage(Buffer.from(await file.arrayBuffer()), file.name, folder);
  } catch {
    return {
      status: 'error',
      message: 'That file is not a supported image (webp, jpeg, png, avif).',
    };
  }

  const supabase = await createServerSupabase();
  const { error: upErr } = await supabase.storage
    .from('media')
    .upload(processed.storagePath, Buffer.from(await file.arrayBuffer()), {
      contentType: processed.mimeType,
      cacheControl: '31536000',
      upsert: false,
    });
  // "already exists" means identical bytes were uploaded before: fine, reuse.
  if (upErr && !/already exists/i.test(upErr.message)) {
    return { status: 'error', message: `Upload failed: ${upErr.message}` };
  }

  const { error: rowErr } = await supabase.from('media').upsert(
    {
      storage_path: processed.storagePath,
      public_url: publicUrlFor(processed.storagePath),
      width: processed.width,
      height: processed.height,
      blur_data_url: processed.blurDataURL,
      alt,
      mime_type: processed.mimeType,
      bytes: processed.bytes,
      created_by: email,
    },
    { onConflict: 'storage_path' },
  );
  if (rowErr)
    return { status: 'error', message: `Saved the file but not its record: ${rowErr.message}` };

  revalidatePath('/admin/media/');
  return {
    status: 'ok',
    message: `Uploaded ${processed.storagePath} (${processed.width}×${processed.height}).`,
  };
}

export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('media').update({ alt: alt.trim() }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/media/');
}
```

- [ ] **Step 4: Upload form and library page**

`components/admin/media-upload.tsx`:

```tsx
'use client';

import { useActionState } from 'react';
import { uploadMedia, type MediaActionState } from '@/app/actions/media';

export function MediaUpload() {
  const [state, action, pending] = useActionState<MediaActionState, FormData>(uploadMedia, {
    status: 'idle',
  });
  return (
    <form action={action} className="flex flex-col gap-3 rounded border border-paper-edge p-4">
      <h2 className="font-display text-xl">Upload an image</h2>
      <input name="file" type="file" accept="image/webp,image/jpeg,image/png,image/avif" required />
      <label className="text-sm">
        Folder
        <select name="folder" defaultValue="work" className="ml-2 rounded border px-2 py-1">
          <option value="projects">projects</option>
          <option value="work">work</option>
          <option value="blog">blog</option>
          <option value="hero">hero</option>
        </select>
      </label>
      <label className="text-sm">
        Alt text (what the picture shows, for screen readers and Google)
        <textarea name="alt" required rows={2} className="mt-1 w-full rounded border px-2 py-1" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-brand-600 px-4 py-2 text-white"
      >
        {pending ? 'Uploading…' : 'Upload'}
      </button>
      {state.message && (
        <p role="status" className={state.status === 'error' ? 'text-red-700' : 'text-ink-soft'}>
          {state.message}
        </p>
      )}
    </form>
  );
}
```

`app/admin/media/page.tsx`:

```tsx
import Image from 'next/image';
import { listMedia } from '@/app/actions/media';
import { MediaUpload } from '@/components/admin/media-upload';
import { requireAdmin } from '@/lib/auth/admin';

export default async function MediaLibraryPage() {
  await requireAdmin();
  const rows = await listMedia();
  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">Media library</h1>
      <div className="mt-6">
        <MediaUpload />
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded border border-paper-edge p-2 text-xs">
            <Image
              src={row.public_url}
              alt={row.alt}
              width={row.width}
              height={row.height}
              sizes="(min-width: 640px) 33vw, 100vw"
              placeholder="blur"
              blurDataURL={row.blur_data_url}
              className="aspect-[4/3] w-full rounded object-cover"
            />
            <p className="mt-2 break-all font-mono">{row.storage_path}</p>
            <p className="mt-1 text-ink-soft">{row.alt || <em>No alt text</em>}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx vitest run tests/unit/media-actions.test.ts && npm run verify`
Expected: PASS. Manually: upload a JPEG at `/admin/media/`, confirm it appears with dimensions, open its public URL and check the response header `cache-control: max-age=31536000`.

- [ ] **Step 6: Commit**

```bash
git add app/actions/media.ts app/admin/media components/admin/media-upload.tsx tests/unit/media-actions.test.ts
git commit -m "feat(cms): add media library with immutable uploads"
```

---

### Task 9: Entry editor — list, form, save, publish, preview

**Files:**

- Create: `app/actions/content.ts`
- Create: `lib/content/form-fields.ts`
- Create: `components/admin/entry-form.tsx`
- Create: `components/admin/media-picker.tsx`
- Create: `app/admin/[collection]/page.tsx`
- Create: `app/admin/[collection]/[slug]/page.tsx`
- Create: `app/admin/[collection]/new/page.tsx`
- Create: `app/admin/preview/[collection]/[slug]/page.tsx`
- Test: `tests/unit/form-fields.test.ts`, `tests/unit/content-actions.test.ts`

**Interfaces:**

- Produces: `saveEntry(prev, formData): Promise<SaveState>` where `formData` carries `collection`, `slug`, `status`, and `data` (JSON string); `deleteEntry(collection, slug)`; `fieldsFor(collection): FieldSpec[]` where `FieldSpec = { name: string; kind: 'text' | 'textarea' | 'lines' | 'boolean' | 'image' | 'json' | 'date'; required: boolean }`.
- Consumes: `collectionSchemas`, `contentTag`, `requireAdmin`, `listMedia`, `toMediaRef`, `getEntryForPreview`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/form-fields.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fieldsFor } from '@/lib/content/form-fields';

describe('fieldsFor', () => {
  it('derives editor field kinds from the service schema', () => {
    const byName = Object.fromEntries(fieldsFor('services').map((f) => [f.name, f]));
    expect(byName.slug).toMatchObject({ kind: 'text', required: true });
    expect(byName.summary).toMatchObject({ kind: 'textarea' });
    expect(byName.body).toMatchObject({ kind: 'lines' });
    expect(byName.includes).toMatchObject({ kind: 'lines' });
    expect(byName.image).toMatchObject({ kind: 'image', required: false });
  });

  it('falls back to a JSON field for nested structures', () => {
    const byName = Object.fromEntries(fieldsFor('projects').map((f) => [f.name, f]));
    expect(byName.images).toMatchObject({ kind: 'json' });
    expect(byName.testimonial).toMatchObject({ kind: 'json' });
    expect(byName.isFeatured).toMatchObject({ kind: 'boolean' });
  });

  it('treats ISO date fields as dates', () => {
    const byName = Object.fromEntries(fieldsFor('posts').map((f) => [f.name, f]));
    expect(byName.publishedAt).toMatchObject({ kind: 'date' });
    expect(byName.body).toMatchObject({ kind: 'textarea' });
  });
});
```

`tests/unit/content-actions.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const updateTag = vi.fn();
const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({ updateTag, revalidatePath }));
vi.mock('@/lib/auth/admin', () => ({ requireAdmin: async () => ({ email: 'kaner@simple.biz' }) }));

const upsert = vi.fn(async () => ({ error: null }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: async () => ({ from: () => ({ upsert }) }),
}));

describe('saveEntry', () => {
  afterEach(() => vi.clearAllMocks());

  const form = (over: Record<string, string>) => {
    const fd = new FormData();
    fd.set('collection', 'services');
    fd.set('slug', 'interior-painting');
    fd.set('status', 'published');
    fd.set(
      'data',
      JSON.stringify({
        slug: 'interior-painting',
        title: 'Interior painting',
        shortTitle: 'Interior',
        audience: 'commercial',
        summary: 'Staged so the space keeps working.',
        body: ['One.'],
        includes: ['Walls'],
      }),
    );
    for (const [k, v] of Object.entries(over)) fd.set(k, v);
    return fd;
  };

  it('validates, upserts, and expires the collection tag on publish', async () => {
    const { saveEntry } = await import('@/app/actions/content');
    const result = await saveEntry({ status: 'idle' }, form({}));
    expect(result.status).toBe('ok');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'services',
        slug: 'interior-painting',
        status: 'published',
        updated_by: 'kaner@simple.biz',
      }),
      { onConflict: 'collection,slug' },
    );
    expect(updateTag).toHaveBeenCalledWith('content:services');
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
  });

  it('returns field errors instead of saving invalid data', async () => {
    const { saveEntry } = await import('@/app/actions/content');
    const result = await saveEntry(
      { status: 'idle' },
      form({ data: JSON.stringify({ slug: 'Nope' }) }),
    );
    expect(result.status).toBe('error');
    expect(result.fieldErrors?.title).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rejects an unknown collection', async () => {
    const { saveEntry } = await import('@/app/actions/content');
    const result = await saveEntry({ status: 'idle' }, form({ collection: 'sectors' }));
    expect(result.status).toBe('error');
  });
});
```

- [ ] **Step 2: Run them, expect failure**

Run: `npx vitest run tests/unit/form-fields.test.ts tests/unit/content-actions.test.ts`
Expected: FAIL on unresolved modules.

- [ ] **Step 3: Field derivation**

`lib/content/form-fields.ts`:

```ts
import { z } from 'zod';
import { collectionSchemas, type Collection } from './schemas';

export type FieldKind = 'text' | 'textarea' | 'lines' | 'boolean' | 'image' | 'json' | 'date';
export type FieldSpec = { name: string; kind: FieldKind; required: boolean };

/** Long-form string fields get a textarea; everything else a single line. */
const TEXTAREA = new Set([
  'summary',
  'challenge',
  'initialCondition',
  'coatingSystem',
  'body',
  'excerpt',
  'metaDescription',
]);

function unwrap(schema: z.ZodTypeAny): { inner: z.ZodTypeAny; optional: boolean } {
  if (schema instanceof z.ZodOptional)
    return { inner: unwrap(schema.unwrap()).inner, optional: true };
  if (schema instanceof z.ZodDefault)
    return { inner: unwrap(schema._def.innerType).inner, optional: true };
  return { inner: schema, optional: false };
}

function kindOf(name: string, schema: z.ZodTypeAny): FieldKind {
  if (schema instanceof z.ZodBoolean) return 'boolean';
  if (schema instanceof z.ZodString) {
    const hasDateRegex = schema._def.checks.some(
      (c) => c.kind === 'regex' && c.regex.source.startsWith('^\\d{4}-\\d{2}-\\d{2}$'),
    );
    if (hasDateRegex) return 'date';
    return TEXTAREA.has(name) ? 'textarea' : 'text';
  }
  if (schema instanceof z.ZodLiteral) return 'text';
  if (schema instanceof z.ZodArray && schema.element instanceof z.ZodString) return 'lines';
  if (
    schema instanceof z.ZodObject &&
    'src' in schema.shape &&
    'alt' in schema.shape &&
    !('quote' in schema.shape)
  ) {
    return 'image';
  }
  return 'json';
}

/**
 * Turns a collection's Zod object into editor fields. Kept deliberately
 * shallow: anything nested that is not an image becomes a validated JSON
 * textarea (spec §6). The schema, not this file, decides what is valid.
 */
export function fieldsFor(collection: Collection): FieldSpec[] {
  const shape = collectionSchemas[collection].shape as Record<string, z.ZodTypeAny>;
  return Object.entries(shape).map(([name, schema]) => {
    const { inner, optional } = unwrap(schema);
    return { name, kind: kindOf(name, inner), required: !optional };
  });
}
```

(The `body` field is `lines` for services because the schema says `z.array(z.string())`, and `textarea` for posts because there it is a `z.string()`. The test covers both.)

- [ ] **Step 4: Save, delete actions**

`app/actions/content.ts`:

```ts
'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { collectionSchemas, isCollection, slugSchema } from '@/lib/content/schemas';
import { contentTag } from '@/lib/content/tags';
import { createServerSupabase } from '@/lib/supabase/server';

export type SaveState = {
  status: 'idle' | 'ok' | 'error';
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

/** Public paths that show a given entry, for precise revalidation. */
function pathsFor(collection: string, slug: string): string[] {
  switch (collection) {
    case 'projects':
      return ['/projects/', `/projects/${slug}/`, '/'];
    case 'services':
      return ['/commercial/', '/trade-services/', '/'];
    case 'posts':
      return ['/blog/', `/blog/${slug}/`];
    default:
      return [];
  }
}

export async function saveEntry(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { email } = await requireAdmin();

  const collection = String(formData.get('collection') ?? '');
  if (!isCollection(collection)) return { status: 'error', message: 'Unknown collection.' };

  const status = formData.get('status') === 'published' ? 'published' : 'draft';

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get('data') ?? '{}'));
  } catch {
    return { status: 'error', message: 'The form produced invalid JSON. Reload and try again.' };
  }

  if (collection === 'posts' && typeof raw === 'object' && raw !== null) {
    (raw as Record<string, unknown>).updatedAt = new Date().toISOString().slice(0, 10);
  }

  const parsed = collectionSchemas[collection].safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Fix the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const slug = parsed.data.slug;
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('content_entries').upsert(
    {
      collection,
      slug,
      status,
      data: parsed.data,
      updated_by: email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'collection,slug' },
  );
  if (error) return { status: 'error', message: `Could not save: ${error.message}` };

  // Drafts never reach the public cache, so only a publish expires it.
  if (status === 'published') {
    updateTag(contentTag(collection));
    for (const path of pathsFor(collection, slug)) revalidatePath(path);
    revalidatePath('/sitemap.xml');
    revalidatePath('/llms.txt');
  }
  revalidatePath(`/admin/${collection}/`);

  return {
    status: 'ok',
    message: status === 'published' ? 'Published. Live within a few seconds.' : 'Draft saved.',
  };
}

export async function deleteEntry(collection: string, slug: string): Promise<void> {
  await requireAdmin();
  if (!isCollection(collection)) throw new Error('Unknown collection');
  slugSchema.parse(slug);
  const supabase = await createServerSupabase();
  const { error } = await supabase.from('content_entries').delete().match({ collection, slug });
  if (error) throw new Error(error.message);
  updateTag(contentTag(collection));
  for (const path of pathsFor(collection, slug)) revalidatePath(path);
  revalidatePath('/sitemap.xml');
  revalidatePath(`/admin/${collection}/`);
}
```

- [ ] **Step 5: Form, picker, pages**

`components/admin/media-picker.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { MediaRow } from '@/app/actions/media';
import { toMediaRef } from '@/app/actions/media';
import type { MediaRef } from '@/lib/content/types';

type Props = { media: MediaRow[]; value?: MediaRef; onChange: (ref: MediaRef | undefined) => void };

export function MediaPicker({ media, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="flex items-center gap-3">
          {/* Plain img: this is an admin thumbnail, not a public asset. */}
          <img src={value.src} alt={value.alt} className="h-16 w-24 rounded object-cover" />
          <div className="text-xs">
            <p className="max-w-xs truncate">{value.alt}</p>
            <button type="button" className="underline" onClick={() => onChange(undefined)}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-soft">No image.</p>
      )}
      <button
        type="button"
        className="self-start text-sm underline"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? 'Close library' : 'Choose from library'}
      </button>
      {open && (
        <ul className="grid max-h-72 grid-cols-4 gap-2 overflow-auto rounded border border-paper-edge p-2">
          {media.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="block w-full"
                onClick={() => {
                  onChange(toMediaRef(row));
                  setOpen(false);
                }}
              >
                <img
                  src={row.public_url}
                  alt={row.alt}
                  className="aspect-[4/3] w-full rounded object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

`components/admin/entry-form.tsx`:

```tsx
'use client';

import { useActionState, useState } from 'react';
import { saveEntry, type SaveState } from '@/app/actions/content';
import type { MediaRow } from '@/app/actions/media';
import type { FieldSpec } from '@/lib/content/form-fields';
import type { MediaRef } from '@/lib/content/types';
import { MediaPicker } from './media-picker';
import { AiButton } from './ai-button';

type Props = {
  collection: string;
  fields: FieldSpec[];
  initial: Record<string, unknown>;
  initialStatus: 'draft' | 'published';
  media: MediaRow[];
};

export function EntryForm({ collection, fields, initial, initialStatus, media }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(initial);
  const [state, action, pending] = useActionState<SaveState, FormData>(saveEntry, {
    status: 'idle',
  });
  const set = (name: string, value: unknown) => setData((d) => ({ ...d, [name]: value }));

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="collection" value={collection} />
      <input type="hidden" name="slug" value={String(data.slug ?? '')} />
      <input type="hidden" name="data" value={JSON.stringify(data)} />

      {fields.map((field) => {
        const errors = state.fieldErrors?.[field.name];
        const value = data[field.name];
        const label = (
          <span className="text-sm font-medium">
            {field.name}
            {field.required && <span aria-hidden="true"> *</span>}
          </span>
        );
        return (
          <div key={field.name} className="flex flex-col gap-1">
            {field.kind === 'boolean' ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => set(field.name, e.target.checked)}
                />
                {label}
              </label>
            ) : field.kind === 'image' ? (
              <>
                {label}
                <MediaPicker
                  media={media}
                  value={value as MediaRef | undefined}
                  onChange={(r) => set(field.name, r)}
                />
              </>
            ) : field.kind === 'lines' ? (
              <>
                {label}
                <textarea
                  rows={6}
                  className="rounded border border-paper-edge px-2 py-1 font-mono text-sm"
                  value={Array.isArray(value) ? (value as string[]).join('\n') : ''}
                  onChange={(e) =>
                    set(
                      field.name,
                      e.target.value.split('\n').filter((l) => l.trim() !== ''),
                    )
                  }
                />
                <span className="text-xs text-ink-soft">One item per line.</span>
              </>
            ) : field.kind === 'json' ? (
              <>
                {label}
                <textarea
                  rows={8}
                  className="rounded border border-paper-edge px-2 py-1 font-mono text-xs"
                  defaultValue={value === undefined ? '' : JSON.stringify(value, null, 2)}
                  onBlur={(e) => {
                    const text = e.target.value.trim();
                    if (text === '') return set(field.name, undefined);
                    try {
                      set(field.name, JSON.parse(text));
                    } catch {
                      // Leave the previous value; the save will report the schema error.
                    }
                  }}
                />
              </>
            ) : field.kind === 'textarea' ? (
              <>
                <div className="flex items-center justify-between">
                  {label}
                  {collection === 'posts' && field.name === 'excerpt' && (
                    <AiButton
                      task="post-summary"
                      input={{ title: String(data.title ?? ''), body: String(data.body ?? '') }}
                      onResult={(r) => setData((d) => ({ ...d, ...r }))}
                    />
                  )}
                </div>
                <textarea
                  rows={field.name === 'body' ? 20 : 4}
                  className="rounded border border-paper-edge px-2 py-1"
                  value={String(value ?? '')}
                  onChange={(e) => set(field.name, e.target.value)}
                />
                {field.name === 'metaDescription' && (
                  <span className="text-xs text-ink-soft">{String(value ?? '').length}/160</span>
                )}
              </>
            ) : (
              <>
                {label}
                <input
                  type={field.kind === 'date' ? 'date' : 'text'}
                  className="rounded border border-paper-edge px-2 py-1"
                  value={String(value ?? '')}
                  onChange={(e) => set(field.name, e.target.value)}
                />
              </>
            )}
            {errors && <p className="text-xs text-red-700">{errors.join(' ')}</p>}
          </div>
        );
      })}

      <div className="flex items-center gap-3 border-t border-paper-edge pt-4">
        <button
          type="submit"
          name="status"
          value="draft"
          disabled={pending}
          className="rounded border px-4 py-2"
        >
          Save draft
        </button>
        <button
          type="submit"
          name="status"
          value="published"
          disabled={pending}
          className="rounded bg-brand-600 px-4 py-2 text-white"
        >
          Publish
        </button>
        <a
          href={`/admin/preview/${collection}/${String(data.slug ?? '')}/`}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline"
        >
          Preview
        </a>
        <span className="text-xs text-ink-soft">Currently: {initialStatus}</span>
      </div>
      {state.message && (
        <p role="status" className={state.status === 'error' ? 'text-red-700' : 'text-ink-soft'}>
          {state.message}
        </p>
      )}
    </form>
  );
}
```

`AiButton` is created in Task 10. Until then, create `components/admin/ai-button.tsx` as a stub that renders nothing, so this task compiles:

```tsx
'use client';
export function AiButton(_props: {
  task: string;
  input: Record<string, string>;
  onResult: (r: Record<string, string>) => void;
}) {
  return null;
}
```

`app/admin/[collection]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { isCollection } from '@/lib/content/schemas';
import { createServerSupabase } from '@/lib/supabase/server';

type Props = { params: Promise<{ collection: string }> };

export default async function CollectionPage({ params }: Props) {
  await requireAdmin();
  const { collection } = await params;
  if (!isCollection(collection)) notFound();

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('content_entries')
    .select('slug, status, updated_at, updated_by')
    .eq('collection', collection)
    .order('updated_at', { ascending: false });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl capitalize tracking-tight">{collection}</h1>
        <Link
          href={`/admin/${collection}/new/`}
          className="rounded bg-brand-600 px-4 py-2 text-white"
        >
          New
        </Link>
      </div>
      <table className="mt-6 w-full text-sm">
        <thead className="text-left text-ink-soft">
          <tr>
            <th className="py-2">Slug</th>
            <th>Status</th>
            <th>Updated</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((row) => (
            <tr key={row.slug} className="border-t border-paper-edge">
              <td className="py-2">
                <Link href={`/admin/${collection}/${row.slug}/`} className="underline">
                  {row.slug}
                </Link>
              </td>
              <td>{row.status}</td>
              <td>{new Date(row.updated_at).toLocaleString('en-AU')}</td>
              <td>{row.updated_by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

`app/admin/[collection]/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { listMedia } from '@/app/actions/media';
import { EntryForm } from '@/components/admin/entry-form';
import { requireAdmin } from '@/lib/auth/admin';
import { fieldsFor } from '@/lib/content/form-fields';
import { isCollection } from '@/lib/content/schemas';
import { getEntryForPreview } from '@/lib/content/source';

type Props = { params: Promise<{ collection: string; slug: string }> };

export default async function EditEntryPage({ params }: Props) {
  await requireAdmin();
  const { collection, slug } = await params;
  if (!isCollection(collection)) notFound();
  const entry = await getEntryForPreview(collection, slug);
  if (!entry) notFound();
  const media = await listMedia();

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">
        {collection} / {slug}
      </h1>
      <div className="mt-6">
        <EntryForm
          collection={collection}
          fields={fieldsFor(collection)}
          initial={entry.data as Record<string, unknown>}
          initialStatus={entry.status}
          media={media}
        />
      </div>
    </>
  );
}
```

In the collection list page above, hide the "New" link when `collection` is a singleton (`'settings' | 'pages'`, added in Task 12). Until Task 12 lands, the check is simply `collection !== 'settings' && collection !== 'pages'`; Task 12 replaces it with `!isSingleton(collection)`.

`app/admin/[collection]/new/page.tsx` is the same page with `initial` set to the collection's empty defaults and `initialStatus="draft"`. The `blank` record is typed `Record<Collection, ...>`, so Task 12 must add `settings` and `pages` entries to it when it widens `Collection`:

```tsx
import { notFound } from 'next/navigation';
import { listMedia } from '@/app/actions/media';
import { EntryForm } from '@/components/admin/entry-form';
import { requireAdmin } from '@/lib/auth/admin';
import { fieldsFor } from '@/lib/content/form-fields';
import { isCollection, type Collection } from '@/lib/content/schemas';

const blank: Record<Collection, Record<string, unknown>> = {
  projects: {
    slug: '',
    title: '',
    clientOrPropertyType: '',
    location: '',
    sectorSlug: '',
    challenge: '',
    scopeOfWork: [],
    images: [],
    outcome: [],
    relatedServiceSlugs: [],
    relatedLocationSlugs: [],
    isFeatured: false,
  },
  services: {
    slug: '',
    title: '',
    shortTitle: '',
    audience: 'commercial',
    summary: '',
    body: [],
    includes: [],
  },
  posts: {
    slug: '',
    title: '',
    excerpt: '',
    body: '',
    publishedAt: new Date().toISOString().slice(0, 10),
    author: 'APMG Painting',
    tags: [],
    metaTitle: '',
    metaDescription: '',
  },
};

type Props = { params: Promise<{ collection: string }> };

export default async function NewEntryPage({ params }: Props) {
  await requireAdmin();
  const { collection } = await params;
  if (!isCollection(collection)) notFound();
  const media = await listMedia();
  return (
    <>
      <h1 className="font-display text-3xl tracking-tight">New {collection.slice(0, -1)}</h1>
      <div className="mt-6">
        <EntryForm
          collection={collection}
          fields={fieldsFor(collection)}
          initial={blank[collection]}
          initialStatus="draft"
          media={media}
        />
      </div>
    </>
  );
}
```

`app/admin/preview/[collection]/[slug]/page.tsx` renders drafts using the public page's presentational pieces. To keep this honest without duplicating the project page, extract the body of `app/projects/[slug]/page.tsx` below the `notFound()` check into `components/pages/project-article.tsx` exporting `ProjectArticle({ project, sector, related })`, and have both the public page and the preview page render it. For services and posts, preview shows the service card / post article in the same way (Task 11 adds `PostArticle`). The preview page:

```tsx
import { notFound } from 'next/navigation';
import { ProjectArticle } from '@/components/pages/project-article';
import { requireAdmin } from '@/lib/auth/admin';
import { isCollection } from '@/lib/content/schemas';
import { getEntryForPreview } from '@/lib/content/source';
import { getSector } from '@/content/sectors';

type Props = { params: Promise<{ collection: string; slug: string }> };

export default async function PreviewPage({ params }: Props) {
  await requireAdmin();
  const { collection, slug } = await params;
  if (!isCollection(collection)) notFound();
  const entry = await getEntryForPreview(collection, slug);
  if (!entry) notFound();

  return (
    <>
      <p className="bg-yellow-100 px-4 py-2 text-center text-sm">
        Preview — {entry.status}. Not what the public sees until published.
      </p>
      {collection === 'projects' && (
        <ProjectArticle project={entry.data} sector={getSector(entry.data.sectorSlug)} />
      )}
      {collection !== 'projects' && (
        <pre className="mx-auto max-w-3xl overflow-auto p-6 text-xs">
          {JSON.stringify(entry.data, null, 2)}
        </pre>
      )}
    </>
  );
}
```

(Task 11 replaces the `<pre>` for posts with `PostArticle`.)

- [ ] **Step 6: Verify**

Run: `npx vitest run tests/unit/form-fields.test.ts tests/unit/content-actions.test.ts && npm run verify`
Expected: PASS. Manually, using the landing page's "What we paint" cards as the acceptance case: open `/admin/services/interior-painting/`, change `summary`, edit one line of `includes`, and swap `image` via the picker. Publish. Reload `/` and confirm the Interior card shows the new summary, the new chip, and the new photo within seconds, with no layout shift while the image loads. Then check `/commercial/` shows the same change.

Also add an e2e check to `tests/e2e/critical-flows.spec.ts` (or a new `tests/e2e/landing-services.spec.ts`) that the landing page renders one card per service with a heading and a summary:

```ts
import { expect, test } from '@playwright/test';

test('landing page "What we paint" renders a card per service with a photo or a plain card', async ({
  page,
}) => {
  await page.goto('/');
  const cards = page.locator('#services article');
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(5);
  for (let i = 0; i < count; i++) {
    await expect(cards.nth(i).getByRole('heading', { level: 3 })).toBeVisible();
    await expect(cards.nth(i).locator('p').first()).not.toBeEmpty();
  }
});
```

- [ ] **Step 7: Commit**

```bash
git add app/actions/content.ts lib/content/form-fields.ts components/admin components/pages app/admin app/projects tests/unit/form-fields.test.ts tests/unit/content-actions.test.ts
git commit -m "feat(cms): add entry editor with draft, publish and preview"
```

---

### Task 10: AI assist — Claude summaries and alt text

**Files:**

- Create: `lib/ai/claude.ts`
- Create: `app/actions/ai.ts`
- Modify: `components/admin/ai-button.tsx` (replace stub)
- Modify: `components/admin/media-upload.tsx` (add "Describe with AI")
- Test: `tests/unit/ai-prompts.test.ts`

**Interfaces:**

- Produces: `draftPostSummary({ title, body }): Promise<{ excerpt; metaTitle; metaDescription }>`; `describeImage(imageUrl): Promise<{ alt; caption }>`; `summariseProject(project: Project): Promise<{ summary; metaDescription }>`; `hasAi(): boolean`; `HOUSE_RULES` string.
- Consumes: `requireAdmin`.

- [ ] **Step 1: Install the SDK**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Step 2: Write the failing test**

`tests/unit/ai-prompts.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('ai helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reports AI as unavailable without a key', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const { hasAi } = await import('@/lib/ai/claude');
    expect(hasAi()).toBe(false);
  });

  it('house rules forbid invented claims and residential work', async () => {
    const { HOUSE_RULES } = await import('@/lib/ai/claude');
    expect(HOUSE_RULES).toMatch(/commercial/i);
    expect(HOUSE_RULES).toMatch(/do not invent|never invent/i);
    expect(HOUSE_RULES).toMatch(/Australian English/);
    expect(HOUSE_RULES).toContain('APMG Painting');
  });

  it('clamps meta description to 160 characters even if the model runs long', async () => {
    const { clampMeta } = await import('@/lib/ai/claude');
    const long = 'A'.repeat(200);
    expect(clampMeta(long).length).toBeLessThanOrEqual(160);
    expect(clampMeta('Short.')).toBe('Short.');
  });
});
```

- [ ] **Step 3: Run it, expect failure**

Run: `npx vitest run tests/unit/ai-prompts.test.ts`
Expected: FAIL, cannot resolve `@/lib/ai/claude`.

- [ ] **Step 4: Implement**

`lib/ai/claude.ts`:

```ts
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type { Project } from '@/lib/content/types';

/**
 * Editor-facing AI assist. Three short, single-call tasks. Every result is
 * schema-validated before it reaches a form field, and nothing here writes
 * to the database: the editor still has to save.
 */

export const MODEL = 'claude-opus-5';

export const HOUSE_RULES = [
  'You write for APMG Painting, a commercial painting contractor in Melbourne, Australia.',
  'Use Australian English spelling. Refer to the company only as "APMG Painting".',
  'The company is commercial only: offices, schools, healthcare, industrial, strata, retail. Never describe residential or house painting.',
  'Do not invent facts, figures, durations, client names, products or outcomes. Use only what the source material states. If something is unknown, leave it out.',
  'Plain, specific, unhurried prose. No marketing superlatives, no exclamation marks, no emoji.',
].join(' ');

export function hasAi(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function clampMeta(text: string, max = 160): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max - 1).replace(/[,;:\s]+$/, '')}…`;
}

const client = () => new Anthropic();

const postSummarySchema = z.object({
  excerpt: z.string().describe('Two sentences, under 300 characters, for the blog index card.'),
  metaTitle: z.string().describe('Under 60 characters, ends with " | APMG Painting".'),
  metaDescription: z.string().describe('Under 155 characters, one specific benefit, no clickbait.'),
});

export async function draftPostSummary(input: { title: string; body: string }) {
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: zodOutputFormat(postSummarySchema) },
    system: HOUSE_RULES,
    messages: [
      {
        role: 'user',
        content: `Draft the excerpt, meta title and meta description for this blog post.\n\nTitle: ${input.title}\n\n${input.body}`,
      },
    ],
  });
  const parsed = response.parsed_output;
  if (!parsed) throw new Error('The model returned no structured output.');
  return {
    excerpt: parsed.excerpt.trim().slice(0, 300),
    metaTitle: parsed.metaTitle.trim().slice(0, 70),
    metaDescription: clampMeta(parsed.metaDescription),
  };
}

const imageSchema = z.object({
  alt: z
    .string()
    .describe(
      'Under 125 characters. What a screen reader user needs. Names the surface, action and setting. No "image of".',
    ),
  caption: z.string().describe('One sentence for a gallery caption.'),
});

export async function describeImage(imageUrl: string) {
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 1000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: zodOutputFormat(imageSchema) },
    system: HOUSE_RULES,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          {
            type: 'text',
            text: 'Write alt text and a caption for this photograph from an APMG Painting job. Describe only what is visible.',
          },
        ],
      },
    ],
  });
  const parsed = response.parsed_output;
  if (!parsed) throw new Error('The model returned no structured output.');
  return { alt: parsed.alt.trim().slice(0, 125), caption: parsed.caption.trim() };
}

const projectSummarySchema = z.object({
  summary: z.string().describe('Two or three sentences for a project card.'),
  metaDescription: z.string().describe('Under 155 characters.'),
});

export async function summariseProject(project: Project) {
  const facts = JSON.stringify(
    {
      title: project.title,
      clientOrPropertyType: project.clientOrPropertyType,
      location: project.location,
      challenge: project.challenge,
      scopeOfWork: project.scopeOfWork,
      outcome: project.outcome,
    },
    null,
    2,
  );
  const response = await client().beta.messages.parse({
    model: MODEL,
    max_tokens: 1500,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: zodOutputFormat(projectSummarySchema) },
    system: HOUSE_RULES,
    messages: [
      { role: 'user', content: `Summarise this case study from these facts only:\n\n${facts}` },
    ],
  });
  const parsed = response.parsed_output;
  if (!parsed) throw new Error('The model returned no structured output.');
  return { summary: parsed.summary.trim(), metaDescription: clampMeta(parsed.metaDescription) };
}
```

If `client().beta.messages.parse` does not accept `betas`/`fallbacks` in the installed SDK version, drop those two lines and use `client().messages.parse` instead; the typecheck decides. Do not guess further: the shape of `parse` + `zodOutputFormat` is documented in the SDK's `helpers/zod` module.

`app/actions/ai.ts`:

```ts
'use server';

import { requireAdmin } from '@/lib/auth/admin';
import { describeImage, draftPostSummary, hasAi, summariseProject } from '@/lib/ai/claude';
import { projectSchema } from '@/lib/content/schemas';

export type AiResult<T> = { ok: true; data: T } | { ok: false; message: string };

function unavailable<T>(): AiResult<T> {
  return { ok: false, message: 'AI assist is not configured on this deployment.' };
}

export async function aiPostSummary(input: { title: string; body: string }) {
  await requireAdmin();
  if (!hasAi()) return unavailable<Awaited<ReturnType<typeof draftPostSummary>>>();
  if (input.body.trim().length < 200)
    return { ok: false as const, message: 'Write at least a couple of paragraphs first.' };
  try {
    return { ok: true as const, data: await draftPostSummary(input) };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : 'AI request failed.',
    };
  }
}

export async function aiDescribeImage(imageUrl: string) {
  await requireAdmin();
  if (!hasAi()) return unavailable<Awaited<ReturnType<typeof describeImage>>>();
  if (!/^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/media\//.test(imageUrl)) {
    return { ok: false as const, message: 'Only images in the media library can be described.' };
  }
  try {
    return { ok: true as const, data: await describeImage(imageUrl) };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : 'AI request failed.',
    };
  }
}

export async function aiProjectSummary(raw: unknown) {
  await requireAdmin();
  if (!hasAi()) return unavailable<Awaited<ReturnType<typeof summariseProject>>>();
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false as const, message: 'Fill in the challenge, scope and outcome first.' };
  try {
    return { ok: true as const, data: await summariseProject(parsed.data) };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : 'AI request failed.',
    };
  }
}
```

`components/admin/ai-button.tsx` (replace the stub):

```tsx
'use client';

import { useState, useTransition } from 'react';
import { aiDescribeImage, aiPostSummary } from '@/app/actions/ai';

type Props =
  | {
      task: 'post-summary';
      input: { title: string; body: string };
      onResult: (r: Record<string, string>) => void;
    }
  | {
      task: 'describe-image';
      input: { imageUrl: string };
      onResult: (r: Record<string, string>) => void;
    };

/**
 * One button, one field group. Fills the form; never saves. The editor
 * reads what came back and decides.
 */
export function AiButton(props: Props) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = () =>
    start(async () => {
      setMessage(null);
      const result =
        props.task === 'post-summary'
          ? await aiPostSummary(props.input)
          : await aiDescribeImage(props.input.imageUrl);
      if (result.ok) {
        props.onResult(result.data as Record<string, string>);
        setMessage('Drafted. Check it before saving.');
      } else {
        setMessage(result.message);
      }
    });

  return (
    <span className="flex items-center gap-2 text-xs">
      <button type="button" onClick={run} disabled={pending} className="rounded border px-2 py-1">
        {pending
          ? 'Thinking…'
          : props.task === 'post-summary'
            ? 'Draft summary with AI'
            : 'Describe with AI'}
      </button>
      {message && <span className="text-ink-soft">{message}</span>}
    </span>
  );
}
```

In `components/admin/media-upload.tsx`, the alt textarea gets an AI button that works on an already-uploaded image: since `describeImage` needs a public URL, the flow is upload with a provisional alt, then on the library grid each card gets a "Describe with AI" button that calls `aiDescribeImage(row.public_url)` and then `updateMediaAlt(row.id, alt)`. Add that card control as a small client component `components/admin/media-alt-editor.tsx` taking `{ id, publicUrl, alt }` and using `AiButton` plus a save button calling `updateMediaAlt`. Relax the upload validation to allow an empty alt when `formData.get('describeLater') === 'on'`, and show "No alt text" in red in the grid so it is never forgotten.

- [ ] **Step 5: Verify**

Run: `npx vitest run tests/unit/ai-prompts.test.ts && npm run verify`
Expected: PASS. Manually with `ANTHROPIC_API_KEY` set: on a draft post with a few paragraphs, click "Draft summary with AI" and see excerpt, meta title and meta description fill; in the media library, click "Describe with AI" on an uploaded photo and confirm the alt reads as a description of the visible scene. Without the key, the buttons report AI as not configured.

- [ ] **Step 6: Commit**

```bash
git add lib/ai app/actions/ai.ts components/admin tests/unit/ai-prompts.test.ts package.json package-lock.json
git commit -m "feat(cms): add Claude-drafted summaries, meta and alt text"
```

---

### Task 11: Blog routes, schema, sitemap, nav

**Files:**

- Create: `app/blog/page.tsx`
- Create: `app/blog/[slug]/page.tsx`
- Create: `components/pages/post-article.tsx`
- Modify: `lib/schema/index.ts` (add `blogPostingSchema`)
- Modify: `app/sitemap.ts`, `components/navigation/nav-data.ts`, `app/llms.txt/route.ts`, `app/admin/preview/[collection]/[slug]/page.tsx`
- Test: `tests/unit/schema.test.ts` (extend), `tests/e2e/blog.spec.ts`

**Interfaces:**

- Produces: `blogPostingSchema(post: Post): JsonLdValue`; `PostArticle({ post })`.
- Consumes: `getPosts`, `getPost` (Task 3), `CmsImage` (Task 6), `buildMetadata`.

- [ ] **Step 1: Install the Markdown renderer**

```bash
npm install react-markdown remark-gfm
```

- [ ] **Step 2: Write the failing schema test**

Add to `tests/unit/schema.test.ts`:

```ts
import { blogPostingSchema } from '@/lib/schema';

describe('blog posting schema', () => {
  const post = {
    slug: 'sequencing-an-occupied-office',
    title: 'Sequencing a repaint in an occupied office',
    excerpt: 'How zones are handed back.',
    body: '# Heading\n\nText.',
    publishedAt: '2026-09-01',
    updatedAt: '2026-09-08',
    author: 'APMG Painting',
    tags: ['office'],
    metaTitle: 'Sequencing an occupied office repaint | APMG Painting',
    metaDescription: 'How zones are handed back.',
  };

  it('is a BlogPosting authored by the organisation with both dates', () => {
    const data = blogPostingSchema(post);
    expect(data['@type']).toBe('BlogPosting');
    expect(data.datePublished).toBe('2026-09-01');
    expect(data.dateModified).toBe('2026-09-08');
    expect(JSON.stringify(data.author)).toContain('#organization');
    expect(String(data.url)).toMatch(/\/blog\/sequencing-an-occupied-office\/$/);
  });

  it('never emits an aggregateRating', () => {
    expect(JSON.stringify(blogPostingSchema(post))).not.toMatch(/aggregateRating/);
  });
});
```

- [ ] **Step 3: Run it, expect failure**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: FAIL, `blogPostingSchema` is not exported.

- [ ] **Step 4: Schema builder**

Append to `lib/schema/index.ts`:

```ts
import type { Post } from '@/lib/content/types';

export function blogPostingSchema(post: Post): JsonLdValue {
  const url = `${siteUrl}/blog/${post.slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: 'en-AU',
    // The business writes as itself. No invented personal bylines.
    author: { '@id': `${siteUrl}/#organization` },
    publisher: { '@id': `${siteUrl}/#organization` },
    ...(post.cover ? { image: post.cover.src } : {}),
    keywords: post.tags.join(', '),
  };
}
```

- [ ] **Step 5: Article component and routes**

`components/pages/post-article.tsx`:

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CmsImage } from '@/components/media/cms-image';
import { Container, Section } from '@/components/ui';
import type { Post } from '@/lib/content/types';

/**
 * Markdown is rendered without raw HTML (react-markdown's default), so an
 * editor cannot paste a script tag into a post. GFM gives tables and lists.
 */
export function PostArticle({ post }: { post: Post }) {
  const published = new Date(post.publishedAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <article>
      <Section tone="sunken" className="py-10">
        <Container>
          <p className="mb-3 text-xs font-semibold uppercase tracking-label text-brand-600">
            <time dateTime={post.publishedAt}>{published}</time>
          </p>
          <h1 className="max-w-4xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 max-w-prose text-lg text-ink-soft">{post.excerpt}</p>
        </Container>
      </Section>
      {post.cover && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-paper-sunken sm:aspect-[21/9]">
          <CmsImage image={post.cover} fill priority sizes="100vw" className="object-cover" />
        </div>
      )}
      <Section tone="paper">
        <Container>
          <div className="prose prose-lg max-w-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
          </div>
        </Container>
      </Section>
    </article>
  );
}
```

If the project does not have `@tailwindcss/typography`, add it (`npm install -D @tailwindcss/typography`, register in `tailwind.config.ts` plugins) so `prose` styles apply.

`app/blog/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CmsImage } from '@/components/media/cms-image';
import { Container, Section, SectionHeading } from '@/components/ui';
import { getPosts } from '@/lib/content/source';

export const metadata: Metadata = buildMetadata({
  title: 'Notes from the job | APMG Painting',
  description:
    'Practical notes on commercial painting in Melbourne: sequencing occupied buildings, coating systems, access and compliance.',
  path: '/blog/',
});

export default async function BlogIndexPage() {
  const posts = await getPosts();
  return (
    <>
      <Section tone="sunken" className="py-10">
        <Container>
          <Breadcrumbs crumbs={[{ name: 'Blog', path: '/blog/' }]} />
          <SectionHeading title="Notes from the job" />
        </Container>
      </Section>
      <Section tone="paper">
        <Container>
          {posts.length === 0 ? (
            <p className="text-ink-soft">Nothing published yet.</p>
          ) : (
            <ul className="grid gap-8 md:grid-cols-2">
              {posts.map((post) => (
                <li key={post.slug} className="flex flex-col gap-3">
                  {post.cover && (
                    <Link
                      href={`/blog/${post.slug}/`}
                      className="relative block aspect-[16/9] overflow-hidden rounded bg-paper-sunken"
                    >
                      <CmsImage
                        image={post.cover}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </Link>
                  )}
                  <h2 className="font-display text-2xl tracking-tight">
                    <Link href={`/blog/${post.slug}/`}>{post.title}</Link>
                  </h2>
                  <p className="text-ink-soft">{post.excerpt}</p>
                  <time
                    dateTime={post.publishedAt}
                    className="text-xs uppercase tracking-label text-ink-soft"
                  >
                    {new Date(post.publishedAt).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
```

`app/blog/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/json-ld';
import { PostArticle } from '@/components/pages/post-article';
import { blogPostingSchema } from '@/lib/schema';
import { getPost, getPosts } from '@/lib/content/source';

export async function generateStaticParams() {
  return (await getPosts()).map((post) => ({ slug: post.slug }));
}

export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.metaTitle,
    description: post.metaDescription,
    path: `/blog/${post.slug}/`,
    ogImage: post.cover?.src,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return (
    <>
      <JsonLd data={blogPostingSchema(post)} />
      <PostArticle post={post} />
    </>
  );
}
```

- [ ] **Step 6: Sitemap, nav, llms.txt, preview**

In `app/sitemap.ts`, make the function `async`, add `const posts = await getPosts();` and:

```ts
    { path: '/blog/', priority: 0.6 },   // in staticPaths
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}/`,
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
```

In `components/navigation/nav-data.ts`, add `{ label: 'Blog', href: '/blog/' }` after Projects. Update `tests/unit/nav-active.test.ts` and `tests/e2e/wayfinding.spec.ts` if they assert the nav item count.

In `app/llms.txt/route.ts`, add a "## Notes" section listing each post's title, URL and excerpt from `getPosts()`.

In `app/admin/preview/[collection]/[slug]/page.tsx`, replace the `<pre>` branch for posts with `<PostArticle post={entry.data} />` (guarded by `collection === 'posts'`).

- [ ] **Step 7: E2E**

`tests/e2e/blog.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('blog index renders and is linked from the nav', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Blog' }).first().click();
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Notes from the job');
});

test('sitemap lists the blog index', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).toContain('/blog/');
});
```

- [ ] **Step 8: Verify**

Run: `npm run verify && npm run test:e2e`
Expected: PASS. Manually: create a post in `/admin/posts/new/`, publish, open `/blog/<slug>/`, view source and confirm the `BlogPosting` JSON-LD and that the cover `<img>` has `fetchpriority="high"` and a `<link rel="preload" as="image">` in `<head>`.

- [ ] **Step 9: Commit**

```bash
git add app/blog components/pages/post-article.tsx lib/schema app/sitemap.ts components/navigation/nav-data.ts app/llms.txt app/admin tests package.json package-lock.json tailwind.config.ts
git commit -m "feat(blog): add CMS-backed blog with BlogPosting schema and sitemap entries"
```

---

### Task 12: Business details and the contact page

**Files:**

- Modify: `lib/content/types.ts` (add `SiteSettings`, `ContactPageCopy`)
- Modify: `lib/content/schemas.ts` (add `siteSettingsSchema`, `contactPageSchema`, `isSingleton`, `singletonSlug`)
- Modify: `lib/content/source.ts` (add `getSiteSettings`, `getPage`)
- Modify: `lib/site.ts` (turn `formattedAddress`/`addressNote` into functions of settings; export `defaultSiteSettings`)
- Create: `components/providers/site-settings.tsx`
- Modify: `app/layout.tsx`, `app/contact-us/page.tsx`, `app/about-us/page.tsx`, `app/llms.txt/route.ts`, `components/layout/header.tsx`, `components/layout/footer.tsx`, `components/navigation/mobile-menu.tsx`, `components/chat/quote-chat.tsx`, `components/forms/form-status.tsx`, `components/sections/index.tsx`, `lib/schema/index.ts`
- Modify: `app/actions/content.ts` (`pathsFor`, layout revalidation, no delete for singletons), `app/admin/[collection]/page.tsx`, `app/admin/[collection]/new/page.tsx`, `app/admin/page.tsx`
- Modify: `scripts/seed-cms.mjs` (seed both singletons)
- Test: `tests/unit/site-settings.test.ts`, extend `tests/unit/schema.test.ts`, `tests/e2e/contact.spec.ts`

**Interfaces:**

- Produces: `SiteSettings` and `ContactPageCopy` types; `siteSettingsSchema`, `contactPageSchema`; `isSingleton(c): boolean`; `singletonSlug: { settings: 'site'; pages: 'contact-us' }`; `getSiteSettings(): Promise<SiteSettings>`; `getPage(slug: 'contact-us'): Promise<ContactPageCopy>`; `formatAddress(a: SiteSettings['address']): string`; `addressNote(s: SiteSettings, now?: Date): string | null`; `phoneHref(display: string): string`; `SiteSettingsProvider`, `useSiteSettings()`.
- Consumes: `all()` and `seeds` from Task 3; `EntryForm`, `fieldsFor`, `saveEntry` from Task 9; `localBusinessSchema(services)` signature from Task 4.

- [ ] **Step 1: Write the failing tests**

`tests/unit/site-settings.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  contactPageSchema,
  siteSettingsSchema,
  isSingleton,
  singletonSlug,
} from '@/lib/content/schemas';
import { defaultSiteSettings, addressNote, formatAddress, phoneHref } from '@/lib/site';

describe('site settings', () => {
  it('accepts the current hard-coded facts as the seed', () => {
    const result = siteSettingsSchema.safeParse(defaultSiteSettings);
    expect(result.success, JSON.stringify(result)).toBe(true);
  });

  it('derives the tel link from the display number', () => {
    expect(phoneHref('1300 97 97 40')).toBe('tel:1300979740');
    expect(phoneHref('(03) 9876 5432')).toBe('tel:0398765432');
  });

  it('rejects a phone number that is not Australian', () => {
    const bad = { ...defaultSiteSettings, phone: '+1 555 123 4567' };
    expect(siteSettingsSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an ABN that is not eleven digits', () => {
    expect(siteSettingsSchema.safeParse({ ...defaultSiteSettings, abn: '1234' }).success).toBe(
      false,
    );
    expect(
      siteSettingsSchema.safeParse({ ...defaultSiteSettings, abn: '12 345 678 901' }).success,
    ).toBe(true);
    expect(siteSettingsSchema.safeParse({ ...defaultSiteSettings, abn: null }).success).toBe(true);
  });

  it('formats the address on one line', () => {
    expect(formatAddress(defaultSiteSettings.address)).toBe(
      '1 Turbo Drive, Bayswater North VIC 3153',
    );
  });

  it('shows the move note before the effective date and drops it after', () => {
    const settings = {
      ...defaultSiteSettings,
      address: { ...defaultSiteSettings.address, effectiveFrom: '2026-10-01' },
      previousAddress: 'Factory 15/30 Ramset Dr, Chirnside Park VIC 3116',
    };
    expect(addressNote(settings, new Date('2026-09-15'))).toMatch(/from October 2026/);
    expect(addressNote(settings, new Date('2026-10-02'))).toBeNull();
  });

  it('knows which collections are singletons', () => {
    expect(isSingleton('settings')).toBe(true);
    expect(isSingleton('pages')).toBe(true);
    expect(isSingleton('projects')).toBe(false);
    expect(singletonSlug.settings).toBe('site');
    expect(singletonSlug.pages).toBe('contact-us');
  });

  it('contact page copy keeps the meta description under 160', () => {
    const copy = {
      slug: 'contact-us',
      title: 'Contact us',
      lede: 'Tell us about the site.',
      formHeading: 'Request a site assessment',
      formIntro: 'For schools, clinics and offices.',
      metaTitle: 'Contact APMG Painting | Melbourne Painters',
      metaDescription: 'x'.repeat(161),
    };
    expect(contactPageSchema.safeParse(copy).success).toBe(false);
    expect(contactPageSchema.safeParse({ ...copy, metaDescription: 'Fine.' }).success).toBe(true);
  });
});

describe('getSiteSettings fallback', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns the defaults when there is no database', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { getSiteSettings, getPage } = await import('@/lib/content/source');
    expect((await getSiteSettings()).phone).toBe('1300 97 97 40');
    expect((await getPage('contact-us')).title).toBe('Contact us');
  });
});
```

Add to `tests/unit/schema.test.ts`:

```ts
import { defaultSiteSettings } from '@/lib/site';
import { services } from '@/content/services';

it('LocalBusiness reflects the settings it is given, not the file', () => {
  const changed = {
    ...defaultSiteSettings,
    phone: '1300 00 00 00',
    email: 'hello@apmgpainting.com.au',
  };
  const data = localBusinessSchema(services, changed);
  expect(data.telephone).toBe('1300 00 00 00');
  expect(data.email).toBe('hello@apmgpainting.com.au');
});
```

Every existing call of `localBusinessSchema(services)` in that test file becomes `localBusinessSchema(services, defaultSiteSettings)`.

- [ ] **Step 2: Run them, expect failure**

Run: `npx vitest run tests/unit/site-settings.test.ts tests/unit/schema.test.ts`
Expected: FAIL on missing exports.

- [ ] **Step 3: Types and schemas**

Append to `lib/content/types.ts`:

```ts
/**
 * Business details an editor may change. The trading and legal names are
 * not here on purpose: the one-company-name rule is code, not copy.
 */
export type SiteSettings = {
  /** Display form, e.g. "1300 97 97 40". The tel: link is derived. */
  phone: string;
  email: string;
  address: {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
    /** ISO date the business occupies this address, or null if already there. */
    effectiveFrom: string | null;
  };
  /** Shown alongside the move note until effectiveFrom passes. */
  previousAddress: string | null;
  abn: string | null;
  coords: { latitude: number; longitude: number } | null;
  openingHours: readonly { days: readonly string[]; opens: string; closes: string }[] | null;
  serviceAreaPrimary: string;
  social: { instagram: string | null; facebook: string | null; google: string | null };
};

/** Editable copy on /contact-us/. The form itself is code. */
export type ContactPageCopy = {
  slug: 'contact-us';
  title: string;
  lede: string;
  formHeading: string;
  formIntro: string;
  metaTitle: string;
  metaDescription: string;
};
```

Add to `lib/content/schemas.ts` (after `postSchema`, before `collectionSchemas`):

```ts
const auPhone = z
  .string()
  .trim()
  .regex(
    /^(\(0\d\)\s?\d{4}\s?\d{4}|0\d(\s?\d{4}){2}|1[38]00(\s?\d{2}){3}|13\s?\d{2}\s?\d{2}|04\d{2}(\s?\d{3}){2})$/,
    'Australian landline, 1300/1800 or mobile number',
  );

const abn = z
  .string()
  .trim()
  .regex(/^\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$/, 'ABN is eleven digits')
  .nullable();

const timeHHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM');

export const siteSettingsSchema = z.object({
  phone: auPhone,
  email: z.string().email(),
  address: z.object({
    street: z.string().min(1),
    suburb: z.string().min(1),
    state: z.enum(['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']),
    postcode: z.string().regex(/^\d{4}$/),
    country: z.literal('AU'),
    effectiveFrom: isoDate.nullable(),
  }),
  previousAddress: z.string().nullable(),
  abn,
  coords: z
    .object({ latitude: z.number().min(-44).max(-10), longitude: z.number().min(112).max(154) })
    .nullable(),
  openingHours: z
    .array(
      z.object({
        days: z
          .array(
            z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
          )
          .min(1),
        opens: timeHHMM,
        closes: timeHHMM,
      }),
    )
    .nullable(),
  serviceAreaPrimary: z.string().min(1),
  social: z.object({
    instagram: z.string().url().nullable(),
    facebook: z.string().url().nullable(),
    google: z.string().url().nullable(),
  }),
});

export const contactPageSchema = z.object({
  slug: z.literal('contact-us'),
  title: z.string().min(1).max(60),
  lede: z.string().min(1).max(300),
  formHeading: z.string().min(1).max(80),
  formIntro: z.string().min(1).max(400),
  metaTitle: z.string().min(1).max(70),
  metaDescription: z.string().min(1).max(160),
});

({}) as z.infer<typeof siteSettingsSchema> satisfies Mutable<SiteSettings>;
({}) as z.infer<typeof contactPageSchema> satisfies Mutable<ContactPageCopy>;
```

Then widen the registry:

```ts
export const collectionSchemas = {
  projects: projectSchema,
  services: serviceSchema,
  posts: postSchema,
  settings: siteSettingsSchema,
  pages: contactPageSchema,
} as const;

/** Collections with exactly one entry and a fixed slug. No "New", no delete. */
export const singletonSlug = { settings: 'site', pages: 'contact-us' } as const;

export function isSingleton(collection: Collection): collection is keyof typeof singletonSlug {
  return collection in singletonSlug;
}
```

Import `SiteSettings` and `ContactPageCopy` at the top of the file. Note `siteSettingsSchema` has no `slug` field; the settings row's slug is always `site`, set by the save action (Step 7).

- [ ] **Step 4: Make `lib/site.ts` a source of defaults, not of truth**

In `lib/site.ts`, keep `site.name`, `site.legalName`, `site.founded`, `site.tagline` and the accreditations exactly as they are. Replace the hard-coded `phone`, `email`, `address`, `serviceArea`, `coords`, `openingHours`, `social` and `abn` consumers with a defaults object built from the same values, so nothing is retyped:

```ts
import type { SiteSettings } from '@/lib/content/types';

/**
 * Seed and fallback for the CMS `settings/site` entry. Once seeded, the
 * database wins; this object only answers when there is no database.
 * Values are the ones that were hard-coded here before the CMS existed.
 */
export const defaultSiteSettings: SiteSettings = {
  phone: site.phone.display,
  email: site.email,
  address: {
    street: site.address.street,
    suburb: site.address.suburb,
    state: site.address.state,
    postcode: site.address.postcode,
    country: site.address.country,
    effectiveFrom: site.address.effectiveFrom,
  },
  previousAddress: 'Factory 15/30 Ramset Dr, Chirnside Park VIC 3116',
  abn: site.abn,
  coords: site.coords,
  openingHours: site.openingHours,
  serviceAreaPrimary: site.serviceArea.primary,
  social: {
    instagram: site.social.instagram,
    facebook: site.social.facebook,
    google: site.social.google,
  },
};

export function phoneHref(display: string): string {
  return `tel:${display.replace(/\D/g, '')}`;
}

export function formatAddress(address: SiteSettings['address']): string {
  return [address.street, `${address.suburb} ${address.state} ${address.postcode}`].join(', ');
}

export function addressNote(settings: SiteSettings, now: Date = new Date()): string | null {
  if (!settings.address.effectiveFrom || !settings.previousAddress) return null;
  const effective = new Date(`${settings.address.effectiveFrom}T00:00:00Z`);
  if (Number.isNaN(effective.getTime()) || now >= effective) return null;
  const month = MONTHS[effective.getUTCMonth()];
  return `Our office from ${month} ${effective.getUTCFullYear()}. Until then we work from ${settings.previousAddress}.`;
}
```

Delete the old `formattedAddress` constant, the old `addressNote(now)` and `previousAddress` exports. The compiler will list every consumer; Step 6 fixes each.

Also add the contact page defaults next to it (values copied from today's `app/contact-us/page.tsx`):

```ts
import type { ContactPageCopy } from '@/lib/content/types';

export const defaultContactPage: ContactPageCopy = {
  slug: 'contact-us',
  title: 'Contact us',
  lede: 'Tell us about the site and we will get back to you — or just call.',
  formHeading: 'Request a site assessment',
  formIntro:
    'For schools, clinics, aged care, strata, retail, hospitality, offices and industrial sites. The operating-hours question matters more than any other — tell us when we are allowed on site.',
  metaTitle: 'Contact APMG Painting | Melbourne Painters',
  metaDescription:
    'Contact APMG Painting. Tell us about the site and the scope, or call 1300 97 97 40 for a commercial site assessment.',
};
```

- [ ] **Step 5: Source getters**

In `lib/content/source.ts`, extend `seeds`:

```ts
import { defaultContactPage, defaultSiteSettings } from '@/lib/site';

const seeds: { [C in Collection]: readonly EntryOf<C>[] } = {
  projects: seedProjects as readonly EntryOf<'projects'>[],
  services: seedServices as readonly EntryOf<'services'>[],
  posts: [],
  settings: [defaultSiteSettings],
  pages: [defaultContactPage],
};
```

and add:

```ts
// --- Singletons ------------------------------------------------------------

/** Always resolves: a missing or invalid row falls back to the code defaults. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await all('settings');
  return rows[0] ?? defaultSiteSettings;
}

export async function getPage(slug: 'contact-us'): Promise<ContactPageCopy> {
  const rows = await all('pages');
  return rows.find((p) => p.slug === slug) ?? defaultContactPage;
}
```

Import the two types. Because `parseRows` already drops invalid rows with a warning, a half-saved settings row can never take the phone number off the site; the defaults answer instead.

- [ ] **Step 6: Thread settings through the app**

`components/providers/site-settings.tsx`:

```tsx
'use client';

import { createContext, useContext } from 'react';
import type { SiteSettings } from '@/lib/content/types';

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: SiteSettings;
  children: React.ReactNode;
}) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

/** Client components read business details from here, never from lib/site. */
export function useSiteSettings(): SiteSettings {
  const value = useContext(SiteSettingsContext);
  if (!value) throw new Error('useSiteSettings must be used inside SiteSettingsProvider');
  return value;
}
```

`app/layout.tsx`: make the layout `async`, `const settings = await getSiteSettings();`, wrap `{children}` (and the header/footer if rendered there) in `<SiteSettingsProvider value={settings}>`, pass `settings` as a prop to `<Header>` and `<Footer>`, and pass `settings` (plus `await getServices()`) to `localBusinessSchema`.

Then, file by file:

- `components/layout/header.tsx` (server): accept `settings: SiteSettings`; render `phoneHref(settings.phone)` and `settings.phone`.
- `components/layout/footer.tsx` (server): accept `settings`; use `formatAddress(settings.address)`, `addressNote(settings)`, `phoneHref`, `settings.email`, `settings.abn`, `settings.serviceAreaPrimary`. Keep `site.legalName`.
- `components/navigation/mobile-menu.tsx`, `components/chat/quote-chat.tsx`, `components/forms/form-status.tsx` (client): replace `site.phone.display` with `useSiteSettings().phone` and `site.phone.href` with `phoneHref(useSiteSettings().phone)`. `phoneHref` is a pure function and safe to import into client code; make sure `lib/site.ts` has no `server-only` import.
- `components/sections/index.tsx`: the sections that render the phone (`CtaBand` and the two others at the lines the grep found) are server components; give each a `phone: string` prop and pass `settings.phone` from the pages that render them. The suburb line near the region list takes `baseSuburb: string`.
- `app/about-us/page.tsx`: `const settings = await getSiteSettings();` and use `formatAddress`, `addressNote(settings)`, `settings.address.suburb`, `settings.abn`, `settings.previousAddress`.
- `app/llms.txt/route.ts`: read phone, email and address from `getSiteSettings()`.
- `lib/schema/index.ts`: `localBusinessSchema(services, settings: SiteSettings)`; read `email`, `telephone`, `address`, `sameAs` (filter nulls), `coords` and `openingHours` from `settings`. `locationSchema` (or whichever builder reads `site.address.state` and `site.coords` for the GeoCircle) also takes `settings`.

`app/contact-us/page.tsx` becomes:

```tsx
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CommercialEnquiryForm } from '@/components/forms/enquiry-forms';
import { Container, Section, SectionHeading } from '@/components/ui';
import { getPage, getSiteSettings } from '@/lib/content/source';
import { addressNote, formatAddress, phoneHref } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getPage('contact-us');
  return buildMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: '/contact-us/',
  });
}

export default async function ContactPage() {
  const [copy, settings] = await Promise.all([getPage('contact-us'), getSiteSettings()]);
  const note = addressNote(settings);

  return (
    <>
      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <Breadcrumbs crumbs={[{ name: 'Contact', path: '/contact-us/' }]} />
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-prose text-lg text-ink-soft">{copy.lede}</p>

          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-label text-ink-muted">
                Phone
              </dt>
              <dd className="mt-1">
                <a
                  href={phoneHref(settings.phone)}
                  className="font-display text-xl font-semibold text-brand-700 hover:underline"
                >
                  {settings.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-label text-ink-muted">
                Email
              </dt>
              <dd className="mt-1">
                <a href={`mailto:${settings.email}`} className="text-ink hover:underline">
                  {settings.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-label text-ink-muted">
                Address
              </dt>
              <dd className="mt-1 text-ink">
                {formatAddress(settings.address)}
                {note && <span className="mt-1 block text-sm text-ink-soft">{note}</span>}
              </dd>
            </div>
            {settings.openingHours && settings.openingHours.length > 0 && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-label text-ink-muted">
                  Hours
                </dt>
                <dd className="mt-1 text-ink">
                  {settings.openingHours.map((h) => (
                    <span key={h.days.join()} className="block">
                      {h.days.length > 2
                        ? `${h.days[0]}–${h.days[h.days.length - 1]}`
                        : h.days.join(', ')}{' '}
                      {h.opens}–{h.closes}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Container>
      </Section>

      <div id="quote" className="scroll-mt-16 sm:scroll-mt-20">
        <Section tone="paper" id="commercial">
          <Container width="narrow">
            <p className="mb-2 text-xs font-semibold uppercase tracking-label text-brand-600">
              For organisations
            </p>
            <SectionHeading className="mb-3">{copy.formHeading}</SectionHeading>
            <p className="mb-8 text-ink-soft">{copy.formIntro}</p>
            <CommercialEnquiryForm />
          </Container>
        </Section>
      </div>
    </>
  );
}
```

The Hours block only appears once an editor enters hours, matching the existing rule that invented hours are worse than none.

- [ ] **Step 7: Admin support for singletons**

In `app/actions/content.ts`:

```ts
import { isSingleton, singletonSlug } from '@/lib/content/schemas';

// inside saveEntry, after the collection check and before parsing:
if (isSingleton(collection) && typeof raw === 'object' && raw !== null) {
  (raw as Record<string, unknown>).slug = singletonSlug[collection];
}

// slug for the upsert:
const slug = isSingleton(collection) ? singletonSlug[collection] : parsed.data.slug;
```

`siteSettingsSchema` has no `slug` field; Zod's default object parsing strips the unknown key, so setting it on `raw` is harmless and the upsert uses `slug` from the line above.

Extend `pathsFor`:

```ts
    case 'settings':
      return ['/', '/contact-us/', '/about-us/', '/llms.txt'];
    case 'pages':
      return [`/${slug}/`];
```

and after the existing `updateTag` line, add:

```ts
if (collection === 'settings') revalidatePath('/', 'layout');
```

In `deleteEntry`, add `if (isSingleton(collection)) throw new Error('Singletons cannot be deleted');` after the collection check.

In `app/admin/[collection]/page.tsx`, hide "New" when `isSingleton(collection)`, and label the page "Business details" for `settings` and "Pages" for `pages`. In `app/admin/page.tsx`, list "Business details" and "Contact page" as direct links to `/admin/settings/site/` and `/admin/pages/contact-us/`. In `app/admin/[collection]/new/page.tsx`, add to `blank`:

```ts
  settings: defaultSiteSettings as unknown as Record<string, unknown>,
  pages: defaultContactPage as unknown as Record<string, unknown>,
```

(Those two are never reached because the "New" link is hidden, but the `Record<Collection, ...>` type demands them.)

`fieldsFor` needs no change: `phone`, `email`, `serviceAreaPrimary` become text inputs, `address`, `coords`, `openingHours`, `social` become JSON fields, `abn` and `previousAddress` become text. Add `'lede'` and `'formIntro'` to the `TEXTAREA` set in `lib/content/form-fields.ts`.

- [ ] **Step 8: Seed the singletons**

Append to `scripts/seed-cms.mjs`, after the services loop:

```js
const { defaultSiteSettings, defaultContactPage } = await import('../lib/site.ts');
await upsertEntry('settings', 'site', defaultSiteSettings);
await upsertEntry('pages', 'contact-us', defaultContactPage);
```

`lib/site.ts` imports nothing from Next, so `tsx` can load it.

- [ ] **Step 9: E2E**

`tests/e2e/contact.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('contact page shows one phone number, and it matches the header', async ({ page }) => {
  await page.goto('/contact-us/');
  const headerPhone = await page.locator('header a[href^="tel:"]').first().textContent();
  const contactPhone = await page
    .getByRole('definition')
    .locator('a[href^="tel:"]')
    .first()
    .textContent();
  expect(contactPhone?.trim()).toBe(headerPhone?.trim());
});

test('tel link digits match the displayed number', async ({ page }) => {
  await page.goto('/contact-us/');
  const link = page.getByRole('definition').locator('a[href^="tel:"]').first();
  const href = await link.getAttribute('href');
  const text = (await link.textContent())?.replace(/\D/g, '');
  expect(href).toBe(`tel:${text}`);
});
```

- [ ] **Step 10: Verify**

Run: `npx vitest run tests/unit/site-settings.test.ts tests/unit/schema.test.ts && npm run verify && npm run test:e2e`
Expected: PASS. Manually: in `/admin/settings/site/` change the phone to another valid 1300 number and Publish. Within seconds the header, footer, mobile menu, contact page, about page and the LocalBusiness JSON-LD (view source on `/`) all show the new number. Change it back. Then in `/admin/pages/contact-us/` change the lede and confirm `/contact-us/` updates. Try saving `abn` as `1234` and confirm the field error appears and nothing changes on the site.

- [ ] **Step 11: Commit**

```bash
git add lib/content lib/site.ts components/providers app components lib/schema scripts/seed-cms.mjs tests
git commit -m "feat(cms): make business details and the contact page editable"
```

---

### Task 13: Separate editor deployment and cross-site revalidation

**Files:**

- Create: `lib/app-role.ts`
- Create: `lib/revalidate/notify.ts`
- Create: `app/api/revalidate/route.ts`
- Modify: `next.config.ts` (role-based redirects), `app/actions/content.ts`, `app/actions/auth.ts` (redirect origin), `.env.example`, `README.md`
- Test: `tests/unit/app-role.test.ts`, `tests/unit/revalidate-route.test.ts`, `tests/unit/revalidate-notify.test.ts`

**Interfaces:**

- Produces: `appRole(): 'site' | 'editor'`; `isEditor(): boolean`; `notifyPublicSite(payload: { tags: string[]; paths: string[] }): Promise<{ ok: boolean; message?: string }>`; `POST /api/revalidate` accepting `{ tags: string[]; paths: string[] }` with `Authorization: Bearer <REVALIDATE_SECRET>`.
- Consumes: `saveEntry`/`deleteEntry` and `pathsFor` from Task 9, `contentTag` from Task 3.

- [ ] **Step 1: Write the failing tests**

`tests/unit/app-role.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('appRole', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to site', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', '');
    const { appRole, isEditor } = await import('@/lib/app-role');
    expect(appRole()).toBe('site');
    expect(isEditor()).toBe(false);
  });

  it('is editor only when told so exactly', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'editor');
    const { appRole } = await import('@/lib/app-role');
    expect(appRole()).toBe('editor');
  });

  it('treats any other value as site', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'admin');
    const { appRole } = await import('@/lib/app-role');
    expect(appRole()).toBe('site');
  });
});
```

`tests/unit/revalidate-route.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag, revalidatePath }));

function request(body: unknown, auth?: string) {
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(auth ? { authorization: auth } : {}) },
    body: JSON.stringify(body),
  });
}

describe('POST /api/revalidate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('rejects a missing or wrong secret and touches nothing', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 's3cret');
    const { POST } = await import('@/app/api/revalidate/route');
    expect((await POST(request({ tags: ['content:posts'], paths: [] }))).status).toBe(401);
    expect(
      (await POST(request({ tags: ['content:posts'], paths: [] }, 'Bearer nope'))).status,
    ).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('refuses to run when no secret is configured', async () => {
    vi.stubEnv('REVALIDATE_SECRET', '');
    const { POST } = await import('@/app/api/revalidate/route');
    expect((await POST(request({ tags: [], paths: [] }, 'Bearer anything'))).status).toBe(503);
  });

  it('revalidates only content tags and site-relative paths', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 's3cret');
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(
      request(
        { tags: ['content:posts', 'evil'], paths: ['/blog/', 'https://x.example/', '/../etc'] },
        'Bearer s3cret',
      ),
    );
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith('content:posts', 'max');
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/blog/');
  });
});
```

`tests/unit/revalidate-notify.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('notifyPublicSite', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('is a no-op on the site role', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'site');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { notifyPublicSite } = await import('@/lib/revalidate/notify');
    expect(await notifyPublicSite({ tags: ['content:posts'], paths: ['/blog/'] })).toEqual({
      ok: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts tags and paths with the bearer secret from the editor', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'editor');
    vi.stubEnv('PUBLIC_SITE_ORIGIN', 'https://apmgpainting.com.au');
    vi.stubEnv('REVALIDATE_SECRET', 's3cret');
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { notifyPublicSite } = await import('@/lib/revalidate/notify');
    const result = await notifyPublicSite({ tags: ['content:posts'], paths: ['/blog/'] });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://apmgpainting.com.au/api/revalidate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer s3cret' }),
        body: JSON.stringify({ tags: ['content:posts'], paths: ['/blog/'] }),
      }),
    );
  });

  it('reports failure without throwing', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ROLE', 'editor');
    vi.stubEnv('PUBLIC_SITE_ORIGIN', 'https://apmgpainting.com.au');
    vi.stubEnv('REVALIDATE_SECRET', 's3cret');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('no', { status: 500 })),
    );
    const { notifyPublicSite } = await import('@/lib/revalidate/notify');
    const result = await notifyPublicSite({ tags: [], paths: ['/'] });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/live site did not refresh/i);
  });
});
```

- [ ] **Step 2: Run them, expect failure**

Run: `npx vitest run tests/unit/app-role.test.ts tests/unit/revalidate-route.test.ts tests/unit/revalidate-notify.test.ts`
Expected: FAIL on unresolved modules.

- [ ] **Step 3: Role helper**

`lib/app-role.ts`:

```ts
/**
 * Which deployment this is (spec §8a). Read at build time by next.config.ts
 * and at runtime by the save actions. Anything other than the exact string
 * "editor" is the public site, so a typo can never expose the admin.
 */
export type AppRole = 'site' | 'editor';

export function appRole(): AppRole {
  return process.env.NEXT_PUBLIC_APP_ROLE === 'editor' ? 'editor' : 'site';
}

export function isEditor(): boolean {
  return appRole() === 'editor';
}
```

- [ ] **Step 4: Public endpoint and editor notifier**

`app/api/revalidate/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Called by the editor deployment after a publish (spec §8a). Only content
 * tags and site-relative paths are accepted, so a leaked secret can at worst
 * cause extra rebuilds of pages that already exist.
 */
const TAG = /^content:[a-z]+$/;
const PATH = /^\/(?!\.\.)[A-Za-z0-9\-._~/]*$/;

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 });

  const auth = request.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: { tags?: unknown; paths?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === 'string' && TAG.test(t))
    : [];
  const paths = Array.isArray(body.paths)
    ? body.paths.filter(
        (p): p is string => typeof p === 'string' && PATH.test(p) && !p.includes('..'),
      )
    : [];

  for (const tag of tags) revalidateTag(tag, 'max');
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ revalidated: { tags, paths } });
}
```

`lib/revalidate/notify.ts`:

```ts
import 'server-only';
import { isEditor } from '@/lib/app-role';

export type RevalidatePayload = { tags: string[]; paths: string[] };

/**
 * From the editor deployment, tell the public site what changed. On the
 * public site itself this is a no-op because updateTag already ran locally.
 * Never throws: a failed refresh is reported to the editor, not hidden.
 */
export async function notifyPublicSite(
  payload: RevalidatePayload,
): Promise<{ ok: boolean; message?: string }> {
  if (!isEditor()) return { ok: true };

  const origin = process.env.PUBLIC_SITE_ORIGIN;
  const secret = process.env.REVALIDATE_SECRET;
  if (!origin || !secret) {
    return {
      ok: false,
      message:
        'Saved, but the live site did not refresh: PUBLIC_SITE_ORIGIN or REVALIDATE_SECRET is not set on the editor.',
    };
  }

  try {
    const res = await fetch(`${origin}/api/revalidate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!res.ok)
      return {
        ok: false,
        message: `Saved, but the live site did not refresh (HTTP ${res.status}). Try Publish again.`,
      };
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: 'Saved, but the live site did not refresh (network error). Try Publish again.',
    };
  }
}
```

- [ ] **Step 5: Call it from the save and delete actions**

In `app/actions/content.ts`, `saveEntry`'s publish branch becomes:

```ts
if (status === 'published') {
  const paths = [...pathsFor(collection, slug), '/sitemap.xml', '/llms.txt'];
  updateTag(contentTag(collection));
  for (const path of paths) revalidatePath(path);
  if (collection === 'settings') revalidatePath('/', 'layout');

  const remote = await notifyPublicSite({
    tags: [contentTag(collection)],
    paths: collection === 'settings' ? [...paths, '/'] : paths,
  });
  revalidatePath(`/admin/${collection}/`);
  if (!remote.ok) return { status: 'error', message: remote.message };
}
```

A settings change on the public site needs every page. `revalidatePath('/', 'layout')` cannot be expressed through the endpoint's path list, so on `settings` the endpoint receives the tag (`content:settings`, which every page's `getSiteSettings()` read carries) plus the key paths; the tag is what actually refreshes every page.

Apply the same `notifyPublicSite` call in `deleteEntry` after its `updateTag`, throwing with the returned message if it fails.

- [ ] **Step 6: Role-based redirects in next.config.ts**

Add to `next.config.ts`:

```ts
import { appRole } from './lib/app-role';

const role = appRole();
const editorOrigin = process.env.EDITOR_ORIGIN ?? '';

// inside redirects():
      ...(role === 'editor'
        ? [
            // The editor deployment serves nothing public. Every other path
            // lands on the admin.
            { source: '/', destination: '/admin/', permanent: false },
            {
              source: '/:path((?!admin|api|_next|favicon\\.ico|icon\\.png|apple-icon\\.png|images).*)',
              destination: '/admin/',
              permanent: false,
            },
          ]
        : editorOrigin
          ? [
              // The public site sends anyone who types /admin to the editor.
              { source: '/admin/:path*', destination: `${editorOrigin}/admin/:path*`, permanent: false },
            ]
          : [
              // No editor configured yet: /admin does not exist on the site.
              { source: '/admin/:path*', destination: '/', permanent: false },
            ]),
```

`/images` stays reachable on the editor because the seed assets and the admin's own thumbnails use it. `/api` stays reachable so `/api/revalidate` can be tested on preview deployments of either role.

On the `editor` role, `robots.ts` already disallows everything because `NEXT_PUBLIC_SANDBOX` is never set to `false` there, and `next.config.ts` already sends `X-Robots-Tag: noindex` while the sandbox flag is on. Add a guard so an operator cannot switch it off on the editor: in `lib/site.ts`, `export const isSandbox = process.env.NEXT_PUBLIC_SANDBOX !== 'false' || process.env.NEXT_PUBLIC_APP_ROLE === 'editor';`.

- [ ] **Step 7: Magic-link redirect origin**

`sendMagicLink` in `app/actions/auth.ts` uses `siteUrl` for `emailRedirectTo`. On the editor project, `NEXT_PUBLIC_SITE_URL` is the editor's own origin, so this already resolves to `https://edit.apmgpainting.com.au/admin/auth/callback/`. Add that URL to Supabase Auth → Redirect URLs alongside the localhost one. No code change; confirm in the manual step.

- [ ] **Step 8: Env and docs**

Append to `.env.example`:

```
# --- Deployment role (spec §8a) ------------------------------------
# "site" (default) serves the public website and blocks /admin.
# "editor" serves only /admin and blocks the public routes.
NEXT_PUBLIC_APP_ROLE="site"
# Site role: where /admin should send people. Editor role: unused.
EDITOR_ORIGIN=""
# Editor role: the public site to refresh after a publish. Site role: unused.
PUBLIC_SITE_ORIGIN=""
# Both roles, identical value. Generate with: openssl rand -hex 32
REVALIDATE_SECRET=""
```

In the Vercel dashboard, create the second project from the same repo:

```bash
vercel link --project apmg-painting-editor
vercel env add NEXT_PUBLIC_APP_ROLE production   # editor
vercel env add NEXT_PUBLIC_SITE_URL production   # https://edit.apmgpainting.com.au
vercel env add PUBLIC_SITE_ORIGIN production     # https://apmgpainting.com.au
vercel env add REVALIDATE_SECRET production
# plus the same Supabase and ANTHROPIC_API_KEY values as the site project
```

and on the site project: `EDITOR_ORIGIN`, `REVALIDATE_SECRET`, and leave `NEXT_PUBLIC_APP_ROLE` unset. Add the `edit.` subdomain to the editor project under Domains; Vercel shows the CNAME to add at the DNS host. Until DNS is done, the editor's `*.vercel.app` URL works the same way.

Add to `README.md` under the CMS section a short "Two deployments" paragraph mirroring the table in spec §8a, and the one-line rule: same repo, same branch, two projects, different `NEXT_PUBLIC_APP_ROLE`.

- [ ] **Step 9: Verify**

Run: `npx vitest run tests/unit/app-role.test.ts tests/unit/revalidate-route.test.ts tests/unit/revalidate-notify.test.ts && npm run verify`
Expected: PASS with `NEXT_PUBLIC_APP_ROLE` unset. Then `NEXT_PUBLIC_APP_ROLE=editor npm run build` also passes.

Deploy both projects. Manually:

- Visit the editor origin `/`: lands on `/admin/login/`. Visit `/projects/` there: redirected to `/admin/`.
- Visit the site origin `/admin/`: redirected to the editor origin.
- In the editor, change a service summary and Publish. Reload the public site's `/`: the card shows the new text within seconds. Check the editor shows "Published." and not the refresh warning.
- Temporarily set a wrong `REVALIDATE_SECRET` on the editor, publish again: the save succeeds and the editor shows "Saved, but the live site did not refresh". Restore the secret.
- `curl -I https://edit.apmgpainting.com.au/admin/login/` shows `x-robots-tag: noindex, nofollow`.

- [ ] **Step 10: Commit**

```bash
git add lib/app-role.ts lib/revalidate app/api/revalidate app/actions/content.ts lib/site.ts next.config.ts .env.example README.md tests/unit/app-role.test.ts tests/unit/revalidate-route.test.ts tests/unit/revalidate-notify.test.ts
git commit -m "feat(cms): split editor into its own deployment with cross-site revalidation"
```

---

### Task 14: Performance check and go-live notes

**Files:**

- Modify: `README.md` (CMS section)
- Modify: `docs/CLIENT-BRIEF.md` (editor onboarding paragraph)

- [ ] **Step 1: Measure**

Deploy a preview (`vercel`), then run Lighthouse on a project page and a blog post with a cover:

```bash
npx lighthouse https://<preview>/projects/emmaus-college-school-repaint-vermont/ --only-categories=performance --preset=desktop --output=json --output-path=./lighthouse-project.json
```

Record LCP and CLS. Targets: LCP under 2.5 s on mobile emulation, CLS under 0.05. Then request the hero image URL twice with `curl -I` and confirm the second response carries `x-vercel-cache: HIT` and `cache-control` with `max-age=31536000`.

If LCP misses: check the hero `sizes` matches the rendered width, and that the `priority` image is the first `CmsImage` on the page.

- [ ] **Step 2: Document**

Add to `README.md`:

```markdown
## Content editing (CMS)

Editors sign in at `/admin/` with a magic link. Who may edit is the
`admin_allowlist` table in Supabase, not code. Projects, services and blog
posts are edited there; sectors, suburbs, FAQs and reviews are still in
`content/*.ts` on purpose (see docs/superpowers/specs/2026-09-08-headless-cms-design.md §2).

Without `NEXT_PUBLIC_SUPABASE_URL` the site runs from the TypeScript content
files and `/admin/` is unavailable. To seed a fresh Supabase project:

    node --env-file=.env.local scripts/seed-cms.mjs

Images: upload through the media library. Files are stored under hashed,
immutable names with a one-year cache. Never edit an image in place; upload
the new one and swap it in the entry.
```

Add to `docs/CLIENT-BRIEF.md` a short section "Editing the site yourselves" telling Farbod and Zac they will receive a sign-in link, where the editor is, and that alt text is required on every image because it is what Google reads.

- [ ] **Step 3: Commit**

```bash
git add README.md docs/CLIENT-BRIEF.md
git commit -m "docs: describe the CMS, seeding and image rules"
```

---

## Self-review

**Spec coverage.** §1–§2 scope: Tasks 3, 4, 9, 11 cover projects, services, posts; Task 12 covers the `settings/site` and `pages/contact-us` singletons and threads business details through every consumer, including the client components via context; sectors/locations untouched. §3 content model: Task 1 migration, Task 2 schemas, Task 3 adapter with fallback. §4 image fast path: Task 5 (immutable names, one-year cache, dimensions, blur), Task 4 (`minimumCacheTTL`, remotePatterns), Task 6 (`priority`, `sizes`, `placeholder="blur"`); the loader alternative is isolated in `lib/media/url.ts`. §5 publishing: Task 9 `updateTag` + `revalidatePath`, `dynamicParams = true` in Tasks 4 and 11. §6 editing: Task 9. §7 AI: Task 10 with `claude-opus-5`, structured outputs, `effort: 'low'`, fallbacks. §8 auth: Task 7. §8a two deployments and cross-site revalidation: Task 13 (role helper, build-time redirects, `/api/revalidate`, `notifyPublicSite`, editor always noindex). §9 non-goals respected. §10 risks: Task 14 documents build dependency.

**Placeholder scan.** The migration's "TODO for the operator" is an instruction to a human about data that does not exist yet (Farbod's and Zac's emails), not an unwritten code step. No other TBD/TODO.

**Type consistency.** `MediaRef` (Task 2) is consumed by `CmsImage` (6), `toMediaRef` (8), `MediaPicker` (9). `contentTag` (3) used by `saveEntry`/`deleteEntry` (9). `requireAdmin` (7) used by every action in 8, 9, 10. `getEntryForPreview` (3) used by 9. `fieldsFor` returns `FieldSpec` with the `kind` union used by `EntryForm`. `AiButton` props in Task 10 match the call in Task 9's `EntryForm` (`task: 'post-summary'`, `input: { title, body }`). `blogPostingSchema` takes `Post` (2) and is used in 11. `localBusinessSchema(services)` from Task 4 becomes `localBusinessSchema(services, settings)` in Task 12, and Task 12 updates every caller and the schema test. `isSingleton`/`singletonSlug` (12) are referenced ahead of time in Task 9's list page note, with the interim literal check spelled out there.
