-- Drop existing policies first
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Authenticated users can create own profile" on public.profiles;
drop policy if exists "Authenticated users can view all profiles" on public.profiles;
drop policy if exists "Authenticated users can view interactions" on public.interactions;
drop policy if exists "Authenticated users can insert interactions" on public.interactions;
drop policy if exists "Authenticated users can update interactions" on public.interactions;
drop policy if exists "Only admins can delete interactions" on public.interactions;
drop policy if exists "Users can view tickets" on public.tickets;
drop policy if exists "Users can create tickets" on public.tickets;
drop policy if exists "Users can update tickets" on public.tickets;
drop policy if exists "Reviewers can view all profiles" on public.profiles;
drop policy if exists "Reviewers can view all customers" on public.customers;
drop policy if exists "Anyone can view categories" on public.kb_categories;
drop policy if exists "Only admins can modify categories" on public.kb_categories;
drop policy if exists "Anyone can view articles" on public.kb_articles;
drop policy if exists "Only admins can modify articles" on public.kb_articles;
drop policy if exists "Anyone can view embeddings" on public.kb_embeddings;
drop policy if exists "Only admins can modify embeddings" on public.kb_embeddings;
drop policy if exists "Anyone can view ticket tools" on public.ticket_tools;
drop policy if exists "Only admins can modify ticket tools" on public.ticket_tools;

-- Drop all existing ticket policies
drop policy if exists "Users can view their own tickets or assigned tickets or reviewers can view all" on public.tickets;
drop policy if exists "Users can view tickets" on public.tickets;
drop policy if exists "Users can view their tickets" on public.tickets;
drop policy if exists "Users can create tickets" on public.tickets;
drop policy if exists "Users can update tickets" on public.tickets;
drop policy if exists "Ticket update policy" on public.tickets;
drop policy if exists "Only admins can delete tickets" on public.tickets;
drop policy if exists "Admins can delete tickets" on public.tickets;
drop policy if exists "Ticket viewing policy" on public.tickets;
drop policy if exists "Ticket creation policy" on public.tickets;
drop policy if exists "Ticket update policy" on public.tickets;
drop policy if exists "Ticket deletion policy" on public.tickets;

-- Drop all existing ticket message policies
drop policy if exists "Users can view messages of accessible tickets" on public.ticket_messages;
drop policy if exists "Users can create messages for accessible tickets" on public.ticket_messages;
drop policy if exists "Message viewing policy" on public.ticket_messages;
drop policy if exists "Message creation policy" on public.ticket_messages;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (is_admin(auth.uid()));

create policy "Reviewers can view all profiles"
  on public.profiles for select
  using (get_user_role(auth.uid()) = 'reviewer');

create policy "Authenticated users can view all profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create own profile"
  on public.profiles for insert
  with check (
    auth.role() = 'authenticated'
    and auth.uid() = id
    and (role = 'user' or is_admin(auth.uid()))
  );

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

-- RLS Policies for customers
create policy "Reviewers can view all customers"
  on public.customers for select
  using (get_user_role(auth.uid()) = 'reviewer');

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

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'ticket_tools'
  ) then
    alter publication supabase_realtime add table public.ticket_tools;
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

-- Create new ticket policies
create policy "Ticket viewing policy"
  on public.tickets for select
  using (
    -- Reviewers and admins can see all tickets
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role in ('admin', 'reviewer')
    )
    -- Users can see tickets they created or are assigned to
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  );

create policy "Ticket creation policy"
  on public.tickets for insert
  with check (
    -- Users can only create tickets with themselves as creator
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('user', 'admin', 'reviewer')
    )
  );

create policy "Ticket update policy"
  on public.tickets for update
  using (
    -- Reviewers and admins can update any ticket
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role in ('admin', 'reviewer')
    )
    -- Users can update tickets they created or are assigned to
    or created_by = auth.uid()
    or assigned_to = auth.uid()
  );

create policy "Ticket deletion policy"
  on public.tickets for delete
  using (
    -- Only admins can delete tickets
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role = 'admin'
    )
  );

-- Create new ticket message policies
create policy "Message viewing policy"
  on public.ticket_messages for select
  using (
    -- Reviewers and admins can see all messages
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role in ('admin', 'reviewer')
    )
    -- Users can see messages of tickets they created or are assigned to
    or exists (
      select 1 from public.tickets t
      where t.id = ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

create policy "Message creation policy"
  on public.ticket_messages for insert
  with check (
    -- Reviewers and admins can create messages on any ticket
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role in ('admin', 'reviewer')
    )
    -- Users can create messages on tickets they created or are assigned to
    or exists (
      select 1 from public.tickets t
      where t.id = ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

-- Knowledge base policies
create policy "Anyone can view categories"
  on public.kb_categories for select
  using (true);

create policy "Only admins can modify categories"
  on public.kb_categories for all
  using (is_admin(auth.uid()));

-- Knowledge base article policies
create policy "Anyone can view articles"
  on public.kb_articles for select
  using (true);

create policy "Only admins can modify articles"
  on public.kb_articles for all
  using (is_admin(auth.uid()));

-- Knowledge base embeddings policies
create policy "Anyone can view embeddings"
  on public.kb_embeddings for select
  using (true);

create policy "Only admins can insert embeddings"
  on public.kb_embeddings for insert
  with check (
    exists (
      select 1 from public.kb_articles a
      where a.id = article_id
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and p.role = 'admin'
      )
    )
  );

create policy "Only admins can update embeddings"
  on public.kb_embeddings for update
  using (is_admin(auth.uid()));

create policy "Only admins can delete embeddings"
  on public.kb_embeddings for delete
  using (is_admin(auth.uid()));

-- Ticket tools policies
create policy "Anyone can view ticket tools"
  on public.ticket_tools for select
  using (true);

create policy "Only admins can modify ticket tools"
  on public.ticket_tools for all
  using (is_admin(auth.uid())); 