-- Add has_embeddings column to kb_articles
ALTER TABLE public.kb_articles
ADD COLUMN has_embeddings boolean DEFAULT false;

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