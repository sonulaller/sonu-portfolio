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

-- Projects: public read + admin write --------------
create policy "projects_public_read"  on public.projects for select using (true);
create policy "projects_admin_insert" on public.projects for insert with check (true);
create policy "projects_admin_update" on public.projects for update using (true);
create policy "projects_admin_delete" on public.projects for delete using (true);

-- Blogs: public read + admin write -----------------
create policy "blogs_public_read"  on public.blogs for select using (true);
create policy "blogs_admin_insert" on public.blogs for insert with check (true);
create policy "blogs_admin_update" on public.blogs for update using (true);
create policy "blogs_admin_delete" on public.blogs for delete using (true);

-- Messages: public insert (contact form) + admin read
create policy "messages_public_insert" on public.messages for insert with check (true);
create policy "messages_admin_read"    on public.messages for select using (true);
create policy "messages_admin_delete"  on public.messages for delete using (true);