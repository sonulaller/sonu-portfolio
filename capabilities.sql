-- Capabilities (Skills/Tools) - 8 entries
-- Supabase SQL Editor me run karo

delete from public.capabilities;

insert into public.capabilities (name, icon, sort_order) values
  ('React', '⚛️', 1),
  ('TypeScript', '🔷', 2),
  ('Node.js', '🟢', 3),
  ('Vite', '⚡', 4),
  ('SEO', '🔎', 5),
  ('Groq AI', '🤖', 6),
  ('AI Video Content', '🎬', 7),
  ('Problem Solving', '🛠️', 8);

select * from public.capabilities order by sort_order;