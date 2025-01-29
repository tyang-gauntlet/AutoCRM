-- Drop existing ticket creation policy
drop policy if exists "Users can create tickets" on public.tickets;

-- Create new ticket creation policy that checks if the user is creating a ticket for themselves
create policy "Users can create tickets"
  on public.tickets for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('user', 'admin', 'reviewer')
    )
  ); 