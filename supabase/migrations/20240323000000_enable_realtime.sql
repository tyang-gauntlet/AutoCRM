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

-- Create a proxy table for auth changes
create table if not exists public.auth_sync (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    role text,
    last_sign_in_at timestamp with time zone,
    updated_at timestamp with time zone default now()
);

-- Enable row level security
alter table public.auth_sync enable row level security;

-- Create policy for auth_sync
create policy "Admins can view all auth sync data"
    on public.auth_sync for all
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Function to sync auth changes to proxy table
create or replace function sync_auth_changes()
returns trigger as $$
begin
    insert into public.auth_sync (id, email, role, last_sign_in_at, updated_at)
    values (
        NEW.id,
        NEW.email,
        (NEW.raw_app_meta_data->>'role')::text,
        NEW.last_sign_in_at,
        now()
    )
    on conflict (id) do update
    set 
        email = EXCLUDED.email,
        role = (NEW.raw_app_meta_data->>'role')::text,
        last_sign_in_at = EXCLUDED.last_sign_in_at,
        updated_at = now();
    return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger for auth changes
drop trigger if exists on_auth_user_changed on auth.users;
create trigger on_auth_user_changed
    after insert or update on auth.users
    for each row
    execute function sync_auth_changes();

-- Enable realtime for auth_sync table
do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'auth_sync'
    ) then
        alter publication supabase_realtime add table public.auth_sync;
    end if;
end $$;

-- Add indexes for better performance
create index if not exists idx_auth_sync_email on public.auth_sync(email);
create index if not exists idx_auth_sync_role on public.auth_sync(role);
create index if not exists idx_auth_sync_updated on public.auth_sync(updated_at);

-- Add helpful comments
comment on table public.auth_sync is 'Proxy table for tracking auth.users changes in realtime';
comment on function sync_auth_changes() is 'Syncs auth.users changes to public.auth_sync for realtime tracking'; 