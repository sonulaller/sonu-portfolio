-- Vision & Contact images path update
-- Supabase SQL Editor me run karo

update public.site_images
set url = 'vision.jpg', updated_at = now()
where key = 'vision';

update public.site_images
set url = 'contact.jpg', updated_at = now()
where key = 'contact';

select key, url from public.site_images where key in ('vision','contact');