-- Add text search vector column if not exists
ALTER TABLE public.kb_articles 
    ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
    ) STORED;

-- Add GIN index for full text search if not exists
CREATE INDEX IF NOT EXISTS kb_articles_search_idx ON public.kb_articles USING GIN (search_vector);

-- Add slug if not exists
ALTER TABLE public.kb_articles 
    ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add metadata if not exists
ALTER TABLE public.kb_articles 
    ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add tags array if not exists
ALTER TABLE public.kb_articles 
    ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add category reference if not exists
ALTER TABLE public.kb_articles 
    ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.kb_categories(id);

-- Add content format if not exists
ALTER TABLE public.kb_articles 
    ADD COLUMN IF NOT EXISTS content_format text DEFAULT 'markdown'
    CHECK (content_format IN ('markdown', 'html', 'text'));

-- Add version tracking if not exists
ALTER TABLE public.kb_articles 
    ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Add timestamps if not exists
ALTER TABLE public.kb_articles 
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Add user references if not exists
ALTER TABLE public.kb_articles 
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id); 