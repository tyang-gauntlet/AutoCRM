-- First check if trigger exists and recreate it
drop trigger if exists ensure_profile_exists on auth.users;
drop function if exists ensure_user_profile();

-- Create a function to safely handle profile creation and role sync
create or replace function ensure_user_profile()
returns trigger as $$
declare
  user_count integer;
  assigned_role text;
begin
  -- Log the function entry
  raise notice 'ensure_user_profile triggered for user %', NEW.id;
  
  -- Count existing profiles
  select count(*) into user_count from public.profiles;
  
  -- Determine the role
  assigned_role := case 
    when user_count = 0 then 'admin'  -- First user becomes admin
    when NEW.raw_app_meta_data->>'role' = 'admin' then 'admin'  -- Keep admin role if set
    else 'user'                       -- All other users get default role
  end;

  raise notice 'Creating profile with role % for user %', assigned_role, NEW.id;

  -- Insert new profile
  insert into public.profiles (id, email, role, full_name)
  values (
    NEW.id,
    NEW.email,
    assigned_role,
    NEW.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do update
  set 
    email = EXCLUDED.email,
    role = coalesce(EXCLUDED.role, profiles.role),  -- Keep existing role if new one is null
    full_name = EXCLUDED.full_name;

  -- Update auth.users metadata with the role
  update auth.users
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', assigned_role)
  where id = NEW.id;

  raise notice 'Profile created/updated for user %', NEW.id;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Recreate trigger for initial profile creation
create trigger ensure_profile_exists
  after insert on auth.users
  for each row
  execute function ensure_user_profile();

-- Run a one-time fix for existing users without profiles
do $$
declare
  user_record record;
begin
  raise notice 'Starting one-time profile fix';
  
  for user_record in 
    select * from auth.users 
    where not exists (
      select 1 from public.profiles 
      where profiles.id = users.id
    )
  loop
    raise notice 'Processing user %', user_record.id;
    
    -- Determine role based on existing metadata
    insert into public.profiles (
      id,
      email,
      role,
      full_name
    )
    values (
      user_record.id,
      user_record.email,
      coalesce(
        user_record.raw_app_meta_data->>'role',  -- Use existing role if set
        case when user_record.email = 'admin@example.com' then 'admin' else 'user' end  -- Default admin for known admin email
      ),
      user_record.raw_user_meta_data->>'full_name'
    )
    on conflict (id) do nothing;
    
    raise notice 'Created profile for user %', user_record.id;
  end loop;
end;
$$;

-- Force update for admin user
do $$
begin
  -- Ensure admin user has admin role
  update public.profiles
  set role = 'admin'
  where email = 'admin@example.com'
  and role != 'admin';

  -- Update auth metadata for admin
  update auth.users
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 'admin')
  where email = 'admin@example.com';
end;
$$; 