-- Drop all existing ticket policies
drop policy if exists "Users can view their own tickets or assigned tickets or reviewers can view all" on public.tickets;
drop policy if exists "Users can view tickets" on public.tickets;
drop policy if exists "Users can view their tickets" on public.tickets;
drop policy if exists "Users can create tickets" on public.tickets;
drop policy if exists "Users can update tickets" on public.tickets;
drop policy if exists "Ticket update policy" on public.tickets;
drop policy if exists "Only admins can delete tickets" on public.tickets;
drop policy if exists "Admins can delete tickets" on public.tickets;

-- Drop all existing ticket message policies
drop policy if exists "Users can view messages of accessible tickets" on public.ticket_messages;
drop policy if exists "Users can create messages for accessible tickets" on public.ticket_messages;

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