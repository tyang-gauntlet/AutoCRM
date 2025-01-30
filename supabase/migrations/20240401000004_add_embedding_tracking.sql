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
    )
    WHERE id = NEW.article_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid errors
DROP TRIGGER IF EXISTS maintain_has_embeddings ON public.kb_embeddings;

-- Create trigger to maintain has_embeddings
CREATE TRIGGER maintain_has_embeddings
    AFTER INSERT OR DELETE ON public.kb_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_article_has_embeddings();

-- Update existing articles based on kb_embeddings
UPDATE public.kb_articles
SET has_embeddings = EXISTS (
    SELECT 1 
    FROM public.kb_embeddings 
    WHERE article_id = kb_articles.id
); 