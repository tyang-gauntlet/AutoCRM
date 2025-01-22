-- Create users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text check (role in ('admin', 'reviewer', 'user')) default 'user',
  status text default 'active',
  email text,
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create customers table
create table public.customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  company text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create interactions table
create table public.interactions (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.customers on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  type text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.interactions enable row level security;

-- Drop existing policies
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Profiles access policy" on public.profiles;
drop policy if exists "Profiles update policy" on public.profiles;

-- Create a materialized role check function
create or replace function get_user_role(user_id uuid)
returns text
security definer
set search_path = public
language sql
stable
as $$
    select role from public.profiles where id = user_id;
$$;

-- Create simplified RLS policies
create policy "Profiles select policy"
  on public.profiles for select
  using (
    auth.uid() = id  -- Can see own profile
    OR 
    get_user_role(auth.uid()) = 'admin'  -- Admin can see all profiles
  );

create policy "Profiles update policy"
  on public.profiles for update
  using (
    auth.uid() = id  -- Can update own profile
    OR 
    get_user_role(auth.uid()) = 'admin'  -- Admin can update all profiles
  );

-- Customers policies
create policy "Authenticated users can view customers"
  on public.customers for select
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can insert customers"
  on public.customers for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authenticated users can update customers"
  on public.customers for update
  using ( auth.role() = 'authenticated' );

create policy "Only admins can delete customers"
  on public.customers for delete
  using ( exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) );

-- Interactions policies
create policy "Authenticated users can view interactions"
  on public.interactions for select
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can insert interactions"
  on public.interactions for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update their own interactions"
  on public.interactions for update
  using ( auth.uid() = user_id );

-- Create indexes for better performance
create index customers_email_idx on public.customers (email);
create index customers_phone_idx on public.customers (phone);
create index interactions_customer_id_idx on public.interactions (customer_id);
create index interactions_user_id_idx on public.interactions (user_id);

-- Function to sync user data from auth.users
create or replace function sync_user_data()
returns trigger as $$
begin
  update public.profiles
  set 
    email = (select email from auth.users where id = NEW.id),
    last_sign_in_at = (select last_sign_in_at from auth.users where id = NEW.id)
  where id = NEW.id;
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger for user data synchronization
create trigger on_auth_user_updated
  after insert or update on auth.users
  for each row
  execute function sync_user_data();

-- Add constraint to ensure valid roles
alter table public.profiles 
  alter column role set not null,
  alter column role set default 'user';

-- Function to get user emails safely
create or replace function get_user_emails(user_ids uuid[])
returns table (id uuid, email text)
security definer
set search_path = public
language plpgsql
as $$
begin
    return query
    select au.id, au.email::text
    from auth.users au
    where au.id = any(user_ids);
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function get_user_emails(uuid[]) to authenticated;

-- Remove the user_emails view if it exists
drop view if exists public.user_emails;