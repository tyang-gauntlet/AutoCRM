-- Drop existing foreign key constraints if they exist
alter table public.kb_articles
    drop constraint if exists kb_articles_created_by_fkey,
    drop constraint if exists kb_articles_approved_by_fkey;

-- Add proper foreign key constraints with explicit names
alter table public.kb_articles
    add constraint kb_articles_created_by_fkey
        foreign key (created_by)
        references public.profiles(id)
        on delete set null,
    add constraint kb_articles_approved_by_fkey
        foreign key (approved_by)
        references public.profiles(id)
        on delete set null;

-- Update the getArticles query in useKB hook to use proper join syntax 