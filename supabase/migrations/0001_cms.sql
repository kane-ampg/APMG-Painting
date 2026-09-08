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
  email text primary key check (email = lower(email))
);

-- Who may edit. Add editors here, never in code.
insert into public.admin_allowlist (email) values
  ('kaner@simple.biz')
on conflict do nothing;
-- TODO for the operator, not the code: add Farbod's and Zac's addresses (in
-- lowercase) with the same statement once APMG confirms them.

-- Row level security --------------------------------------------------------
alter table public.content_entries enable row level security;
alter table public.media enable row level security;
alter table public.admin_allowlist enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_allowlist
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
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
