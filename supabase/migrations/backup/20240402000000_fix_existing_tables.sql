-- Drop all existing tables first
do $$ 
begin
    -- Drop tables in correct order to avoid foreign key conflicts
    drop table if exists public.kb_article_versions cascade;
    drop table if exists public.kb_article_chunks cascade;
    drop table if exists public.kb_embeddings cascade;
    drop table if exists public.kb_articles cascade;
    drop table if exists public.kb_tags cascade;
    drop table if exists public.kb_categories cascade;
    drop table if exists public.ticket_feedback cascade;
    drop table if exists public.ticket_messages cascade;
    drop table if exists public.tickets cascade;
    drop table if exists public.interactions cascade;
    drop table if exists public.customers cascade;
    drop table if exists public.ai_metrics cascade;
    drop table if exists public.knowledge_retrieval_metrics cascade;
    drop table if exists public.response_quality_metrics cascade;
    drop table if exists public.auth_sync cascade;
    drop table if exists public.profiles cascade;
end $$;

-- Drop existing functions
drop function if exists public.update_updated_at_column() cascade;
drop function if exists public.handle_ticket_change() cascade;
drop function if exists public.ensure_user_profile() cascade;
drop function if exists public.sync_auth_changes() cascade;
drop function if exists public.match_kb_chunks() cascade;

-- Drop existing triggers
drop trigger if exists ensure_profile_exists on auth.users;
drop trigger if exists on_auth_user_changed on auth.users;
drop trigger if exists notify_ticket_change on public.tickets;

-- Drop existing policies
do $$ 
begin
    execute (
        select string_agg(
            format('drop policy if exists %I on %I.%I;',
                   polname, schemaname, tablename),
            E'\n'
        )
        from pg_policies
        where schemaname = 'public'
    );
end $$;

-- Drop existing publications
drop publication if exists supabase_realtime; 