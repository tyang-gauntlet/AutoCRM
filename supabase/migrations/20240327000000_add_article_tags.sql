-- Add tags array column to kb_articles
alter table public.kb_articles
    add column if not exists tags text[] default '{}';

-- Create tags table for managing available tags
create table if not exists public.kb_tags (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Add RLS policies
alter table public.kb_tags enable row level security;

create policy "Anyone can view tags"
    on public.kb_tags for select
    to authenticated
    using (true);

create policy "Only admins can manage tags"
    on public.kb_tags for all
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- Add some default tags
insert into public.kb_tags (name, description) values
    ('getting-started', 'Basic introduction and setup guides'),
    ('troubleshooting', 'Common issues and their solutions'),
    ('api', 'API documentation and examples'),
    ('security', 'Security-related information'),
    ('deployment', 'Deployment guides and best practices'),
    ('configuration', 'Configuration and settings'),
    ('best-practices', 'Recommended approaches and patterns'),
    ('faq', 'Frequently asked questions')
on conflict (name) do nothing; 