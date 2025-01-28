-- Disable triggers temporarily
set session_replication_role = 'replica';

-- Drop all tables in correct order
do $$ 
declare
    r record;
begin
    -- Drop tables with dependencies first
    for r in (select tablename from pg_tables where schemaname = 'public' order by tablename)
    loop
        execute 'drop table if exists public.' || quote_ident(r.tablename) || ' cascade';
    end loop;
end $$;

-- Drop all functions
do $$ 
declare
    r record;
begin
    for r in (
        select ns.nspname as schema_name, p.proname as function_name, 
               pg_get_function_identity_arguments(p.oid) as args
        from pg_proc p 
        inner join pg_namespace ns on p.pronamespace = ns.oid
        where ns.nspname = 'public'
    )
    loop
        execute format('drop function if exists %I.%I(%s) cascade', 
                      r.schema_name, r.function_name, r.args);
    end loop;
end $$;

-- Drop all triggers
do $$ 
declare
    r record;
begin
    for r in (
        select tgname, relname 
        from pg_trigger t
        join pg_class c on t.tgrelid = c.oid
        where c.relnamespace = 'public'::regnamespace
    )
    loop
        execute format('drop trigger if exists %I on public.%I cascade', 
                      r.tgname, r.relname);
    end loop;
end $$;

-- Drop all policies
do $$ 
declare
    r record;
begin
    for r in (select * from pg_policies where schemaname = 'public')
    loop
        execute format('drop policy if exists %I on %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    end loop;
end $$;

-- Drop publications
drop publication if exists supabase_realtime;

-- Re-enable triggers
set session_replication_role = 'origin'; 