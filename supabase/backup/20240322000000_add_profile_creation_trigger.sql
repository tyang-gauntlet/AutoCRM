-- Drop any previously attempted changes
drop trigger if exists on_auth_user_created on auth.users;
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
  -- Count existing profiles
  select count(*) into user_count from public.profiles;
  
  -- Determine the role
  assigned_role := case 
    when user_count = 0 then 'admin'  -- First user becomes admin
    else 'user'                       -- All other users get default role
  end;

  -- Insert new profile
  insert into public.profiles (id, email, role)
  values (
    NEW.id,
    NEW.email,
    assigned_role
  )
  on conflict (id) do nothing;

  -- Update auth.users metadata with the role
  update auth.users
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', assigned_role)
  where id = NEW.id;

  -- Notify about the new role assignment
  perform pg_notify(
    'role_change',
    json_build_object(
      'user_id', NEW.id,
      'role', assigned_role,
      'event', 'new_user_role'
    )::text
  );
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Create a function to sync profile role changes back to auth.users
create or replace function sync_role_to_auth()
returns trigger as $$
begin
  -- Only proceed if role has changed
  if OLD.role = NEW.role then
    return NEW;
  end if;

  -- Update auth.users metadata with the new role
  update auth.users
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  where id = NEW.id;

  -- Notify about the role change
  perform pg_notify(
    'role_change',
    json_build_object(
      'user_id', NEW.id,
      'old_role', OLD.role,
      'new_role', NEW.role,
      'event', 'role_updated'
    )::text
  );
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Create a function to handle realtime notifications for role changes
create or replace function notify_role_change()
returns trigger as $$
begin
  perform pg_notify(
    'role_change',
    json_build_object(
      'user_id', NEW.id,
      'old_role', OLD.role,
      'new_role', NEW.role,
      'event', 'role_changed',
      'timestamp', extract(epoch from now())
    )::text
  );
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger for initial profile creation
create trigger ensure_profile_exists
  after insert on auth.users
  for each row
  execute function ensure_user_profile();

-- Create trigger for role sync from profiles to auth.users
create trigger sync_role_to_auth
  after update of role on public.profiles
  for each row
  execute function sync_role_to_auth();

-- Create trigger for realtime role change notifications
create trigger notify_role_change
  after update of role on public.profiles
  for each row
  execute function notify_role_change();

-- Enable realtime for profiles table if not already enabled
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- Add helpful comments
comment on function ensure_user_profile() is 'Creates profiles for new users and syncs role to auth.users metadata with realtime notifications';
comment on function sync_role_to_auth() is 'Syncs profile role changes back to auth.users metadata with realtime notifications';
comment on function notify_role_change() is 'Sends realtime notifications for role changes';
comment on trigger ensure_profile_exists on auth.users is 'Creates profiles for new users with role sync';
comment on trigger sync_role_to_auth on public.profiles is 'Keeps auth.users role metadata in sync with profile changes';
comment on trigger notify_role_change on public.profiles is 'Broadcasts role changes in realtime'; 