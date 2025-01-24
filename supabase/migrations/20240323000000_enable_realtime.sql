-- Enable realtime for all remaining tables
do $$
begin
    -- Create publication if it doesn't exist
    if not exists (
        select 1 from pg_publication where pubname = 'supabase_realtime'
    ) then
        create publication supabase_realtime;
    end if;

    -- Add tables if they're not already in the publication
    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'profiles'
    ) then
        alter publication supabase_realtime add table public.profiles;
    end if;

    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'customers'
    ) then
        alter publication supabase_realtime add table public.customers;
    end if;

    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'interactions'
    ) then
        alter publication supabase_realtime add table public.interactions;
    end if;

    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'ticket_messages'
    ) then
        alter publication supabase_realtime add table public.ticket_messages;
    end if;

    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'kb_categories'
    ) then
        alter publication supabase_realtime add table public.kb_categories;
    end if;

    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'kb_articles'
    ) then
        alter publication supabase_realtime add table public.kb_articles;
    end if;
end $$; 