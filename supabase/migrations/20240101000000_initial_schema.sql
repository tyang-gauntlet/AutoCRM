-- Create users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text check (role in ('admin', 'user')) default 'user',
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