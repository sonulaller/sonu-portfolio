insert into public.projects (title, description, tech_stack, live_link, image_emoji, tag)
select
  'NLSP School Website',
  'My first complete website: school frontend, backend, admissions, AI chatbot and a full SEO pass built end-to-end.',
  array['TypeScript','HTML','CSS','JavaScript','SEO','AI Chatbot'],
  'https://github.com/sonulaller/NLSPSCHOOL',
  '🏫',
  'Web Development'
where not exists (select 1 from public.projects where title = 'NLSP School Website');

insert into public.projects (title, description, tech_stack, live_link, image_emoji, tag)
select
  'Screw Nuts',
  'A browser puzzle game where you unscrew the nuts and clear the board. Playable online.',
  array['Web','Game Development','Puzzle'],
  'https://remix-screw-nuts-mechanical-puzzles-1638.ai.studio',
  '🔩',
  'Game'
where not exists (select 1 from public.projects where title = 'Screw Nuts');

insert into public.blogs (title, content, category, cover_image, emoji)
select
  'How I Built My First School Website',
  'I built my first complete school website from scratch. It included the frontend, backend, admissions flow, an AI chatbot and a full SEO pass. The biggest lesson was that real projects teach more than tutorials.',
  'Web Development',
  null,
  '🏫'
where not exists (select 1 from public.blogs where title = 'How I Built My First School Website');

insert into public.blogs (title, content, category, cover_image, emoji)
select
  'What I Learned Doing SEO Alone',
  'I learned SEO by applying it to my own school website instead of only reading guides. I worked through page titles, meta descriptions, structure and content improvements, and learned to check results carefully.',
  'SEO',
  null,
  '🔍'
where not exists (select 1 from public.blogs where title = 'What I Learned Doing SEO Alone');

insert into public.blogs (title, content, category, cover_image, emoji)
select
  'Adding an AI Chatbot to a School Website',
  'Adding an AI chatbot to a real school website taught me how to connect a useful assistant to a frontend. The important part is making it answer common questions clearly and keeping the experience simple for visitors.',
  'AI',
  null,
  '🤖'
where not exists (select 1 from public.blogs where title = 'Adding an AI Chatbot to a School Website');
