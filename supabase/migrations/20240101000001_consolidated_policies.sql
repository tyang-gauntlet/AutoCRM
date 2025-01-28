-- Drop existing policies first
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Authenticated users can view interactions" on public.interactions;
drop policy if exists "Authenticated users can insert interactions" on public.interactions;
drop policy if exists "Authenticated users can update interactions" on public.interactions;
drop policy if exists "Only admins can delete interactions" on public.interactions;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (is_admin(auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      case when role is not null
        then role = (select role from public.profiles where id = auth.uid())
        else true
      end
    )
  );

-- Enable realtime for tables that aren't already in the publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'tickets'
  ) then
    alter publication supabase_realtime add table public.tickets;
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
    and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'ai_metrics'
  ) then
    alter publication supabase_realtime add table public.ai_metrics;
  end if;
end $$;

-- Interactions policies
create policy "Authenticated users can view interactions"
  on public.interactions for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert interactions"
  on public.interactions for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update interactions"
  on public.interactions for update
  using (auth.role() = 'authenticated');

create policy "Only admins can delete interactions"
  on public.interactions for delete
  using (is_admin(auth.uid())); 