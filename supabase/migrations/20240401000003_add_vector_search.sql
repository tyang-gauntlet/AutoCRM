-- Enable vector extension if not exists
create extension if not exists vector;

-- Create HNSW index for vector similarity search
create index if not exists kb_embeddings_embedding_hnsw_idx 
on kb_embeddings 
using hnsw (embedding vector_cosine_ops)
with (m = 16, ef_construction = 64);

-- Create function for matching embeddings
create or replace function match_kb_embeddings(
    query_embedding numeric[],  -- Accept numeric array
    similarity_threshold float default 0.1,  -- Similarity threshold (0.1 to 1.0)
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
    query_vector vector(1536);
    distance_threshold float;
begin
    -- Log input parameters
    raise notice 'Input parameters - similarity_threshold: %, match_count: %', similarity_threshold, match_count;
    raise notice 'Query embedding length: %', array_length(query_embedding, 1);
    
    -- Convert numeric array to vector
    query_vector := query_embedding::vector(1536);
    raise notice 'Query vector created successfully';
    
    -- Calculate distance threshold from similarity threshold
    -- similarity = 1 - distance/2
    -- distance = 2 * (1 - similarity)
    distance_threshold := 2 * (1 - similarity_threshold);
    raise notice 'Distance threshold calculated: %', distance_threshold;
    
    -- Execute query using cosine similarity
    return query
    select
        e.content,
        e.article_id,
        a.title as article_title,
        '/kb/articles/' || a.slug as article_url,
        1 - (e.embedding <=> query_vector)/2 as similarity  -- Convert distance to similarity
    from kb_embeddings e
    join kb_articles a on e.article_id = a.id
    where a.status = 'published'
        and e.embedding is not null
        and (e.embedding <=> query_vector) < distance_threshold  -- Use distance threshold
    order by e.embedding <=> query_vector  -- Order by distance (lowest first)
    limit match_count;
end;
$$; 