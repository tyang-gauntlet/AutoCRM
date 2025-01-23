-- Enable the pg_trgm extension for better text search
create extension if not exists pg_trgm;

-- Create knowledge base categories
create table public.kb_categories (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text not null unique,
    description text,
    parent_id uuid references public.kb_categories(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create knowledge base articles
create table public.kb_articles (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text not null unique,
    content text not null,
    content_format text check (content_format in ('markdown', 'plain')) default 'markdown',
    category_id uuid references public.kb_categories(id) on delete set null,
    status text check (status in ('draft', 'published', 'archived')) default 'draft',
    metadata jsonb default '{}'::jsonb,
    search_vector tsvector generated always as (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
    ) stored,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null
);

-- Create indexes for better performance
create index kb_categories_slug_idx on public.kb_categories (slug);
create index kb_articles_slug_idx on public.kb_articles (slug);
create index kb_articles_category_id_idx on public.kb_articles (category_id);
create index kb_articles_search_idx on public.kb_articles using gin(search_vector);
create index kb_articles_title_trgm_idx on public.kb_articles using gin(title gin_trgm_ops);
create index kb_articles_content_trgm_idx on public.kb_articles using gin(content gin_trgm_ops);

-- Enable RLS
alter table public.kb_categories enable row level security;
alter table public.kb_articles enable row level security;

-- RLS Policies for categories
create policy "Anyone can view published categories"
    on public.kb_categories for select
    using (true);

create policy "Only admins can modify categories"
    on public.kb_categories for all
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- RLS Policies for articles
create policy "Anyone can view published articles"
    on public.kb_articles for select
    using (status = 'published');

create policy "Only admins can modify articles"
    on public.kb_articles for all
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- Function to search knowledge base articles
create or replace function search_kb_articles(
    search_query text,
    category_slug text default null,
    limit_val integer default 10,
    offset_val integer default 0
)
returns table (
    id uuid,
    title text,
    slug text,
    content text,
    category_id uuid,
    status text,
    metadata jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    search_rank float4
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select
        a.id,
        a.title,
        a.slug,
        a.content,
        a.category_id,
        a.status,
        a.metadata,
        a.created_at,
        a.updated_at,
        ts_rank(a.search_vector, websearch_to_tsquery('english', search_query)) as search_rank
    from kb_articles a
    left join kb_categories c on c.id = a.category_id
    where
        a.status = 'published'
        and (search_query is null or a.search_vector @@ websearch_to_tsquery('english', search_query))
        and (category_slug is null or c.slug = category_slug)
    order by search_rank desc, a.created_at desc
    limit limit_val
    offset offset_val;
end;
$$; 