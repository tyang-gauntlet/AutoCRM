-- Drop existing policies first
drop policy if exists "Anyone can view articles" on public.kb_articles;
drop policy if exists "Only admins can modify articles" on public.kb_articles;

-- Enable RLS
alter table public.kb_articles enable row level security;

-- Create policies
create policy "Anyone can view articles"
  on public.kb_articles for select
  using (true);

create policy "Only admins can modify articles"
  on public.kb_articles for all
  using (is_admin(auth.uid())); 