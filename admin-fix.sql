-- ============================================================
--  ADMIN PANEL FIX  — email: lallerjaat97@gmail.com
--  SQL Editor me dono commands paste karke RUN dabao
-- ============================================================

-- Step 1: sirf check karta hai ki account aa gaya ya nahi
select email,
       email_confirmed_at is not null as confirmed,
       raw_app_meta_data
from auth.users
where email = 'lallerjaat97@gmail.com';

-- Step 2: isko confirm + ADMIN role de deta hai
update auth.users
set email_confirmed_at = now(),
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'lallerjaat97@gmail.com';