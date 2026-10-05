-- ============================================================
-- Project card images ko DB me save karo
-- Supabase SQL Editor me pura run karo
-- Ye sirf cover_image column update karta hai,
-- koi existing data delete NAHI hota.
-- ============================================================

update public.projects
set cover_image = 'nlsp-school.jpg'
where title = 'NLSP School Website';

update public.projects
set cover_image = 'screw-nuts.jpg'
where title = 'Screw Nuts';

-- Confirm karne ke liye (optional): ye chalane se result dikhega
select title, cover_image from public.projects order by created_at desc;

-- ============================================================