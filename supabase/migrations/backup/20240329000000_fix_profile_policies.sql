-- Drop existing insert policy if it exists
drop policy if exists "Profiles insert policy" on public.profiles;

-- Create insert policy for profiles
create policy "Profiles insert policy"
  on public.profiles for insert
  with check (
    auth.uid() = id  -- Can create own profile
    OR 
    auth.role() = 'service_role'  -- Service role can create any profile
  ); 