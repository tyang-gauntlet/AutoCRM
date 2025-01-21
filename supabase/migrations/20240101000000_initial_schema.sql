-- Create users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text check (role in ('admin', 'reviewer', 'user')) default 'user',
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

-- Create RLS policies
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

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

-- Add trigger to sync roles between profile and user metadata
create or replace function sync_user_role()
returns trigger as $$
begin
  raise notice 'Syncing role for user % from % to %', NEW.id, OLD.role, NEW.role;
  
  update auth.users 
  set 
    raw_app_meta_data = 
      coalesce(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', NEW.role),
    raw_user_meta_data = 
      coalesce(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('full_name', NEW.full_name)
  where id = NEW.id;

  -- Invalidate all sessions for this user
  delete from auth.sessions where user_id = NEW.id;
  
  raise notice 'Role sync complete for user %', NEW.id;
  return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger for role synchronization
create trigger on_role_update
  after insert or update of role on public.profiles
  for each row
  execute function sync_user_role();

-- Add constraint to ensure valid roles
alter table public.profiles 
  alter column role set not null,
  alter column role set default 'user';