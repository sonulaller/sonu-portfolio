-- =============================================================
--  ADMIN PANEL v2 — SETUP (ek baar run karna hai)
--  Supabase Dashboard → SQL Editor → New query → paste → RUN
-- =============================================================

-- 1) Editable text blocks (hero / about / journey / vision)
create table if not exists public.site_content (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- 2) Images: hero / about / journey
create table if not exists public.site_images (
  key        text primary key,
  url        text not null default '',
  updated_at timestamptz not null default now()
);

-- 3) My Qualifications
create table if not exists public.qualifications (
  id         uuid primary key default gen_random_uuid(),
  degree     text not null,
  institute  text not null default '',
  year       text not null default '',
  score      text not null default '',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

-- 4) My Capabilities (tools chips)
create table if not exists public.capabilities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  icon       text not null default '⚡',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

-- 5) Row Level Security — public sirf padh sakta hai, sirf admin likh sakta hai
alter table public.site_content   enable row level security;
alter table public.site_images    enable row level security;
alter table public.qualifications enable row level security;
alter table public.capabilities   enable row level security;

drop policy if exists "read site_content"   on public.site_content;
drop policy if exists "write site_content"  on public.site_content;
create policy "read site_content"  on public.site_content  for select using (true);
create policy "write site_content" on public.site_content for all
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "read site_images"   on public.site_images;
drop policy if exists "write site_images"  on public.site_images;
create policy "read site_images"  on public.site_images  for select using (true);
create policy "write site_images" on public.site_images for all
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "read qualifications"   on public.qualifications;
drop policy if exists "write qualifications"  on public.qualifications;
create policy "read qualifications"  on public.qualifications  for select using (true);
create policy "write qualifications" on public.qualifications for all
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "read capabilities"   on public.capabilities;
drop policy if exists "write capabilities"  on public.capabilities;
create policy "read capabilities"  on public.capabilities  for select using (true);
create policy "write capabilities" on public.capabilities for all
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 6) Image storage bucket (public)
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;

drop policy if exists "public read portfolio images"   on storage.objects;
drop policy if exists "admin insert portfolio images" on storage.objects;
drop policy if exists "admin update portfolio images" on storage.objects;
drop policy if exists "admin delete portfolio images" on storage.objects;

create policy "public read portfolio images"   on storage.objects for select
  using (bucket_id = 'portfolio-images');
create policy "admin insert portfolio images" on storage.objects for insert
  with check (bucket_id = 'portfolio-images'
              and (auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "admin update portfolio images" on storage.objects for update
  using (bucket_id = 'portfolio-images'
         and (auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check (bucket_id = 'portfolio-images'
              and (auth.jwt()->'app_metadata'->>'role') = 'admin');
create policy "admin delete portfolio images" on storage.objects for delete
  using (bucket_id = 'portfolio-images'
         and (auth.jwt()->'app_metadata'->>'role') = 'admin');

-- 7) Default rows (hero/about/journey/vision text + image slots)
insert into public.site_content (key, value) values
  ('hero_tag',    ''),
  ('about_body',  ''),
  ('journey_body',''),
  ('vision_body', '')
on conflict (key) do nothing;

insert into public.site_images (key, url) values
  ('hero',    ''),
  ('about',   ''),
  ('journey', '')
on conflict (key) do nothing;