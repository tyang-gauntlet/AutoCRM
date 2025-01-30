-- Enable RLS on ticket_feedback table
alter table public.ticket_feedback enable row level security;

-- Drop existing policies if any
drop policy if exists "Feedback viewing policy" on public.ticket_feedback;
drop policy if exists "Feedback creation policy" on public.ticket_feedback;
drop policy if exists "Feedback update policy" on public.ticket_feedback;
drop policy if exists "Feedback deletion policy" on public.ticket_feedback;

-- Create feedback policies
create policy "Feedback viewing policy"
  on public.ticket_feedback for select
  using (
    -- Admins and reviewers can see all feedback
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role in ('admin', 'reviewer')
    )
    -- Users can see feedback for tickets they created or are assigned to
    or exists (
      select 1 from public.tickets t
      where t.id = ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

create policy "Feedback creation policy"
  on public.ticket_feedback for insert
  with check (
    -- Anyone authenticated can create feedback
    auth.role() = 'authenticated'
  );

create policy "Feedback update policy"
  on public.ticket_feedback for update
  using (
    -- Only admins can update feedback
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role = 'admin'
    )
  );

create policy "Feedback deletion policy"
  on public.ticket_feedback for delete
  using (
    -- Only admins can delete feedback
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role = 'admin'
    )
  );

-- Add table to realtime publication if not already added
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'ticket_feedback'
  ) then
    alter publication supabase_realtime add table public.ticket_feedback;
  end if;
end $$; 