-- Drop any existing triggers/functions to avoid conflicts
drop trigger if exists ensure_profile_exists on auth.users;
drop trigger if exists sync_role_to_auth on public.profiles;
drop trigger if exists notify_role_change on public.profiles;
drop function if exists handle_new_user_registration();
drop function if exists safely_create_or_update_profile();
drop function if exists sync_role_to_auth();
drop function if exists notify_role_change();
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
    when NEW.email = 'admin@example.com' then 'admin'  -- Force admin for known admin email
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
    role = case 
      when EXCLUDED.email = 'admin@example.com' then 'admin'  -- Always ensure admin email has admin role
      else coalesce(EXCLUDED.role, profiles.role)  -- Keep existing role if new one is null
    end,
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

-- Run a one-time fix for all users
do $$
declare
  user_record record;
begin
  raise notice 'Starting profile fix for all users';
  
  for user_record in 
    select * from auth.users
  loop
    raise notice 'Processing user % (%)', user_record.id, user_record.email;
    
    -- Determine role based on existing metadata and email
    insert into public.profiles (
      id,
      email,
      role,
      full_name
    )
    values (
      user_record.id,
      user_record.email,
      case 
        when user_record.email = 'admin@example.com' then 'admin'
        when user_record.raw_app_meta_data->>'role' = 'admin' then 'admin'
        else coalesce(user_record.raw_app_meta_data->>'role', 'user')
      end,
      user_record.raw_user_meta_data->>'full_name'
    )
    on conflict (id) do update
    set 
      email = EXCLUDED.email,
      role = case 
        when EXCLUDED.email = 'admin@example.com' then 'admin'
        else coalesce(EXCLUDED.role, profiles.role)
      end,
      full_name = EXCLUDED.full_name;

    -- Ensure auth metadata is updated
    update auth.users
    set raw_app_meta_data = 
      coalesce(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', (
        select role from public.profiles where id = user_record.id
      ))
    where id = user_record.id;
    
    raise notice 'Updated user % with role %', 
      user_record.email, 
      (select role from public.profiles where id = user_record.id);
  end loop;
end;
$$; 