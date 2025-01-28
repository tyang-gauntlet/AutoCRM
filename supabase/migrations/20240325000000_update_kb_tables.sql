-- Add vector extension if not exists
create extension if not exists vector;

-- Add embedding columns and metadata to kb_articles
alter table public.kb_articles
    add column if not exists embedding vector(1536),
    add column if not exists chunk_embeddings jsonb default '[]'::jsonb,
    add column if not exists source_type text check (source_type in ('manual', 'pdf', 'doc', 'docx', 'md')) default 'manual',
    add column if not exists source_url text,
    add column if not exists version integer default 1,
    add column if not exists approved_by uuid references public.profiles(id),
    add column if not exists approved_at timestamptz;

-- Create table for article chunks
create table if not exists public.kb_article_chunks (
    id uuid default gen_random_uuid() primary key,
    article_id uuid references public.kb_articles(id) on delete cascade,
    content text not null,
    embedding vector(1536),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Add version history table
create table if not exists public.kb_article_versions (
    id uuid default gen_random_uuid() primary key,
    article_id uuid references public.kb_articles(id) on delete cascade,
    content text not null,
    version integer not null,
    changes jsonb default '{}'::jsonb,
    created_by uuid references public.profiles(id),
    created_at timestamptz default now()
);

-- Update RLS policies
alter table public.kb_article_chunks enable row level security;
alter table public.kb_article_versions enable row level security;

-- Chunks policies
create policy "Anyone can view published article chunks"
    on public.kb_article_chunks for select
    using (
        exists (
            select 1 from public.kb_articles a
            where a.id = article_id
            and a.status = 'published'
        )
    );

create policy "Only admins can modify chunks"
    on public.kb_article_chunks for all
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- Version history policies
create policy "Anyone can view published article versions"
    on public.kb_article_versions for select
    using (
        exists (
            select 1 from public.kb_articles a
            where a.id = article_id
            and a.status = 'published'
        )
    );

create policy "Only admins can create versions"
    on public.kb_article_versions for insert
    with check (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- Add indexes for vector search
create index if not exists kb_articles_embedding_idx on public.kb_articles using ivfflat (embedding vector_cosine_ops);
create index if not exists kb_article_chunks_embedding_idx on public.kb_article_chunks using ivfflat (embedding vector_cosine_ops);
create index if not exists kb_article_chunks_article_idx on public.kb_article_chunks(article_id);
create index if not exists kb_article_versions_article_idx on public.kb_article_versions(article_id);

-- Add vector similarity search function
create or replace function match_kb_chunks(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
returns table (
    id uuid,
    article_id uuid,
    content text,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        c.id,
        c.article_id,
        c.content,
        1 - (c.embedding <=> query_embedding) as similarity
    from public.kb_article_chunks c
    inner join public.kb_articles a on a.id = c.article_id
    where a.status = 'published'
    and 1 - (c.embedding <=> query_embedding) > match_threshold
    order by similarity desc
    limit match_count;
end;
$$;

-- Enable realtime for new tables
alter publication supabase_realtime add table public.kb_article_chunks;
alter publication supabase_realtime add table public.kb_article_versions; 