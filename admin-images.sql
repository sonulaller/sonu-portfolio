-- ============================================================
-- Image support everywhere: Projects, Capabilities, Vision, Contact
-- Supabase SQL Editor me pura run karo (safe, baar baar chala sakte ho)
-- ============================================================

-- 1) Projects me cover image URL (blogs me cover_image pehle se hai)
alter table public.projects
  add column if not exists cover_image text not null default '';

-- 2) Capabilities me optional image (emoji ke ilawa)
alter table public.capabilities
  add column if not exists image_url text not null default '';

-- 3) Vision aur Contact ke liye naye image slots
insert into public.site_images (key, url) values ('vision', '')
on conflict (key) do nothing;
insert into public.site_images (key, url) values ('contact', '')
on conflict (key) do nothing;

-- 4) Storage me projects/ aur blogs/ folders upload ke waqt apne aap ban jayenge.
--    Kuch alag se banana nahi hai.
-- ============================================================