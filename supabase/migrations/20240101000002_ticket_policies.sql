-- Drop existing policies if any
drop policy if exists "Users can view tickets" on public.tickets;
drop policy if exists "Users can create tickets" on public.tickets;
drop policy if exists "Users can update tickets" on public.tickets;

-- Create policies for tickets
create policy "Users can view tickets"
  on public.tickets for select
  using (
    -- Users can see tickets they created
    created_by = auth.uid()
  );

create policy "Users can create tickets"
  on public.tickets for insert
  with check (
    -- Users can only create tickets with themselves as creator
    created_by = auth.uid()
  );

create policy "Users can update tickets"
  on public.tickets for update
  using (
    -- Users can only update their own tickets
    created_by = auth.uid()
  ); 