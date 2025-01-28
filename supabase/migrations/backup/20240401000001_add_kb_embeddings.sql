-- Enable vector extension if not enabled
create extension if not exists vector;

-- Create embeddings table
create table if not exists public.kb_embeddings (
    id bigint generated always as identity primary key,
    article_id uuid references public.kb_articles(id) on delete cascade,
    content text not null,
    embedding vector(1536) not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Create index for similarity search
create index kb_embeddings_embedding_idx on public.kb_embeddings 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Add RLS policies
alter table public.kb_embeddings enable row level security;

create policy "Embeddings are viewable by authenticated users"
    on public.kb_embeddings for select
    to authenticated
    using (true);

create policy "Embeddings are insertable by service role"
    on public.kb_embeddings for insert
    to authenticated
    with check (
        auth.jwt() ->> 'role' = 'service_role' or
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    ); 