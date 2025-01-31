-- Enable vector extension if not exists
create extension if not exists vector;

-- Add has_embeddings column to kb_articles if not exists
ALTER TABLE public.kb_articles
ADD COLUMN IF NOT EXISTS has_embeddings boolean DEFAULT false;

-- Create kb_embeddings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.kb_embeddings (
    id bigint generated always as identity primary key,
    article_id uuid references public.kb_articles(id) on delete cascade,
    content text not null,
    embedding vector(1536) not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS kb_embeddings_embedding_idx;
DROP INDEX IF EXISTS kb_embeddings_embedding_hnsw_idx;

-- Convert any existing string embeddings to vector type
DO $$ 
BEGIN
    -- Check if we need to convert any string embeddings
    IF EXISTS (
        SELECT 1 
        FROM kb_embeddings 
        WHERE pg_typeof(embedding) = 'text'::regtype
    ) THEN
        -- Create temporary column
        ALTER TABLE kb_embeddings ADD COLUMN temp_embedding vector(1536);
        
        -- Convert string embeddings to vector
        UPDATE kb_embeddings 
        SET temp_embedding = embedding::text::vector(1536)
        WHERE pg_typeof(embedding) = 'text'::regtype;
        
        -- Drop old column and rename new one
        ALTER TABLE kb_embeddings DROP COLUMN embedding;
        ALTER TABLE kb_embeddings RENAME COLUMN temp_embedding TO embedding;
        
        -- Add not null constraint back
        ALTER TABLE kb_embeddings ALTER COLUMN embedding SET NOT NULL;
    END IF;
END $$;

-- Create HNSW index for faster similarity search
CREATE INDEX kb_embeddings_embedding_hnsw_idx ON public.kb_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (
    m = 16,          -- Number of connections per layer
    ef_construction = 64  -- Size of the dynamic candidate list for construction
);

-- Create function to validate embedding dimension
CREATE OR REPLACE FUNCTION get_embedding_dimension(v vector) 
RETURNS integer AS $$
BEGIN
    RETURN array_length(vector_to_float8(v), 1);
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to update has_embeddings based on kb_embeddings
CREATE OR REPLACE FUNCTION update_article_has_embeddings()
RETURNS trigger AS $$
BEGIN
    -- Update has_embeddings when embeddings are added/removed
    UPDATE public.kb_articles
    SET has_embeddings = EXISTS (
        SELECT 1 
        FROM public.kb_embeddings 
        WHERE article_id = NEW.article_id
        AND embedding IS NOT NULL  -- Only count valid embeddings
        AND get_embedding_dimension(embedding) = 1536  -- Ensure proper length
    )
    WHERE id = NEW.article_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid errors
DROP TRIGGER IF EXISTS maintain_has_embeddings ON public.kb_embeddings;

-- Create trigger to maintain has_embeddings
CREATE TRIGGER maintain_has_embeddings
    AFTER INSERT OR DELETE OR UPDATE OF embedding ON public.kb_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_article_has_embeddings();

-- Update existing articles based on kb_embeddings
UPDATE public.kb_articles
SET has_embeddings = EXISTS (
    SELECT 1 
    FROM public.kb_embeddings 
    WHERE article_id = kb_articles.id
    AND embedding IS NOT NULL
    AND get_embedding_dimension(embedding) = 1536
);

-- Add function to safely insert embeddings
CREATE OR REPLACE FUNCTION safe_insert_embedding(
    p_article_id uuid,
    p_content text,
    p_embedding float[],
    p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS bigint AS $$
DECLARE
    v_id bigint;
    v_vector vector(1536);
    v_array_length int;
BEGIN
    -- Log input parameters
    RAISE NOTICE 'Inserting embedding for article %', p_article_id;
    
    -- Check if input is an array
    IF NOT array_ndims(p_embedding) = 1 THEN
        RAISE EXCEPTION 'Input must be a 1-dimensional array, got %', array_ndims(p_embedding);
    END IF;
    
    -- Check array length
    v_array_length := array_length(p_embedding, 1);
    RAISE NOTICE 'Input array length: %', v_array_length;
    
    IF v_array_length != 1536 THEN
        RAISE EXCEPTION 'Input array must have exactly 1536 elements, got %', v_array_length;
    END IF;

    -- Convert float array to vector
    BEGIN
        v_vector := p_embedding::vector(1536);
        RAISE NOTICE 'Successfully converted array to vector';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to convert array to vector: %', SQLERRM;
    END;

    -- Insert the embedding
    INSERT INTO kb_embeddings (article_id, content, embedding, metadata)
    VALUES (p_article_id, p_content, v_vector, p_metadata)
    RETURNING id INTO v_id;

    RAISE NOTICE 'Successfully inserted embedding with id %', v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql; 