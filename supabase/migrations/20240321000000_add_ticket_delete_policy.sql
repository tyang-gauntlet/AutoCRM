-- Add delete policy for tickets
create policy "Admins can delete tickets"
  on public.tickets for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  ); 