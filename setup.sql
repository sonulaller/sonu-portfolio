-- =============================================================
-- Sonu Laller Portfolio — Supabase Setup
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- =============================================================

-- 1) PROJECTS table -------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  tech_stack text[] default '{}',
  live_link text,
  image_emoji text default '🚀',
  tag text default 'Project',
  created_at timestamptz not null default now()
);

-- 2) BLOGS table ----------------------------------
create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  category text default 'General',
  cover_image text,
  emoji text default '📝',
  created_at timestamptz not null default now()
);

-- 3) MESSAGES table -------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- RLS (Row Level Security) ------------------------
alter table public.projects  enable row level security;
alter table public.blogs     enable row level security;
alter table public.messages  enable row level security;

drop policy if exists "projects_public_read"  on public.projects;
drop policy if exists "projects_admin_insert" on public.projects;
drop policy if exists "projects_admin_update" on public.projects;
drop policy if exists "projects_admin_delete" on public.projects;
drop policy if exists "blogs_public_read"     on public.blogs;
drop policy if exists "blogs_admin_insert"    on public.blogs;
drop policy if exists "blogs_admin_update"    on public.blogs;
drop policy if exists "blogs_admin_delete"    on public.blogs;
drop policy if exists "messages_public_insert" on public.messages;
drop policy if exists "messages_admin_read"    on public.messages;
drop policy if exists "messages_admin_delete"  on public.messages;

-- Projects: public read + authenticated admin write
create policy "projects_public_read" on public.projects for select to anon, authenticated using (true);
create policy "projects_admin_insert" on public.projects for insert to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "projects_admin_update" on public.projects for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "projects_admin_delete" on public.projects for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Blogs: public read + authenticated admin write
create policy "blogs_public_read" on public.blogs for select to anon, authenticated using (true);
create policy "blogs_admin_insert" on public.blogs for insert to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "blogs_admin_update" on public.blogs for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "blogs_admin_delete" on public.blogs for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Messages: public insert + authenticated admin access
create policy "messages_public_insert" on public.messages for insert to anon, authenticated with check (true);
create policy "messages_admin_read" on public.messages for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "messages_admin_delete" on public.messages for delete to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');