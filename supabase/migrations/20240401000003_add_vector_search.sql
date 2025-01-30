-- Enable vector extension if not already enabled
create extension if not exists vector;

-- Create function for matching embeddings
create or replace function match_kb_embeddings(
    query_embedding float[],
    similarity_threshold float default 0.8,
    match_count int default 5
)
returns table (
    content text,
    article_id uuid,
    article_title text,
    article_url text,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        e.content,
        e.article_id,
        a.title as article_title,
        '/kb/articles/' || a.slug as article_url,
        (e.embedding::vector(1536)) <=> (query_embedding::vector(1536)) as similarity
    from kb_embeddings e
    join kb_articles a on e.article_id = a.id
    where a.status = 'published'
        and e.embedding is not null
    order by similarity asc
    limit match_count;
end;
$$; 