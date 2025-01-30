-- Enable vector extension if not already enabled
create extension if not exists vector;

-- Create function for matching embeddings
create or replace function match_kb_embeddings(
    query_embedding vector(1536),
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
declare
    _embedding vector(1536);
begin
    -- Cast input to vector type
    _embedding := query_embedding::vector(1536);
    
    return query
    select
        e.content,
        e.article_id,
        a.title as article_title,
        '/kb/articles/' || a.slug as article_url,
        1 - (e.embedding <=> _embedding) as similarity
    from kb_embeddings e
    join kb_articles a on e.article_id = a.id
    where 1 - (e.embedding <=> _embedding) > similarity_threshold
        and a.status = 'published'
        and e.embedding is not null
    order by e.embedding <=> _embedding asc
    limit match_count;
end;
$$; 