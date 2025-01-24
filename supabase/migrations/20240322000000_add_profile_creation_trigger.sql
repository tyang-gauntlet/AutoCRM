-- Drop any previously attempted changes
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user_registration();
drop function if exists safely_create_or_update_profile();

-- Create a function to safely handle profile creation
create or replace function ensure_user_profile()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    NEW.id,
    NEW.email,
    'user'
  )
  on conflict (id) do nothing;  -- If profile exists, let sync_user_data handle the update
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Create a trigger that runs BEFORE the sync_user_data trigger
create trigger ensure_profile_exists
  after insert on auth.users
  for each row
  execute function ensure_user_profile();

-- Add helpful comments
comment on function ensure_user_profile() is 'Ensures a profile exists for new users, letting sync_user_data handle updates';
comment on trigger ensure_profile_exists on auth.users is 'Creates profiles for new users if they don''t exist'; 