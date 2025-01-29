-- Drop existing function and trigger
drop trigger if exists ensure_profile_exists on auth.users;
drop function if exists ensure_user_profile();

-- Create the function with security definer
create or replace function ensure_user_profile()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  user_count integer;
  assigned_role text;
begin
  -- Count existing profiles
  select count(*) into user_count from public.profiles;
  
  -- Determine the role
  assigned_role := case 
    when user_count = 0 then 'admin'  -- First user becomes admin
    else 'user'                       -- All other users get default role
  end;

  -- Insert new profile
  insert into public.profiles (id, email, role, full_name)
  values (
    NEW.id,
    NEW.email,
    assigned_role,
    coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  on conflict (id) do nothing;

  -- Update auth.users metadata with the role
  update auth.users
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', assigned_role)
  where id = NEW.id;

  return NEW;
end;
$$;

-- Recreate the trigger
create trigger ensure_profile_exists
  after insert on auth.users
  for each row
  execute function ensure_user_profile();

-- Backfill profiles for existing users
do $$
declare
  u record;
begin
  for u in 
    select * from auth.users 
    where not exists (
      select 1 from public.profiles where id = users.id
    )
  loop
    perform ensure_user_profile();
  end loop;
end;
$$; 