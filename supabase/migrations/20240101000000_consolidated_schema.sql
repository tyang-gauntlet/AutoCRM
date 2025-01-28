-- Enable required extensions
create extension if not exists "pg_trgm";
create extension if not exists "vector";

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create profiles table and related functions
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    role text check (role in ('admin', 'reviewer', 'user')) default 'user',
    status text default 'active',
    email text,
    last_sign_in_at timestamptz,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Profile management function
create or replace function ensure_user_profile()
returns trigger as $$
declare
  user_count integer;
  assigned_role text;
begin
  raise notice 'ensure_user_profile triggered for user %', NEW.id;
  
  select count(*) into user_count from public.profiles;
  
  assigned_role := case 
    when user_count = 0 then 'admin'  -- First user becomes admin
    when NEW.raw_app_meta_data->>'role' = 'admin' then 'admin'
    when NEW.email = 'admin@example.com' then 'admin'
    else 'user'
  end;

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
      when EXCLUDED.email = 'admin@example.com' then 'admin'
      else coalesce(EXCLUDED.role, profiles.role)
    end,
    full_name = EXCLUDED.full_name;

  update auth.users
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', assigned_role)
  where id = NEW.id;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Create profile trigger
create trigger ensure_profile_exists
  after insert on auth.users
  for each row
  execute function ensure_user_profile();

-- Helper functions
create or replace function get_user_role(user_id uuid)
returns text
security definer
set search_path = public
language sql
stable
as $$
    select role from public.profiles where id = user_id;
$$;

create or replace function is_admin(user_id uuid)
returns boolean
security definer
set search_path = public
language sql
stable
as $$
    select role = 'admin' from public.profiles where id = user_id;
$$;

-- Create core tables
create table public.customers (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    email text,
    phone text,
    company text,
    status text default 'active',
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.tickets (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text not null,
    status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
    customer_id uuid references public.customers(id) on delete cascade,
    assigned_to uuid references public.profiles(id) on delete set null,
    created_by uuid references public.profiles(id) on delete set null,
    ai_handled boolean default false,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.ticket_messages (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references public.tickets(id) on delete cascade not null,
    content text not null,
    sender_id uuid references public.profiles(id) on delete set null,
    is_ai boolean default false,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.ticket_feedback (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references public.tickets(id) on delete cascade not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Create knowledge base tables
create table public.kb_categories (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text not null unique,
    description text,
    parent_id uuid references public.kb_categories(id),
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.kb_tags (
    id uuid default gen_random_uuid() primary key,
    name text not null unique,
    description text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.kb_articles (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text not null unique,
    content text not null,
    content_format text check (content_format in ('markdown', 'html', 'text')) default 'markdown',
    category_id uuid references public.kb_categories(id) on delete set null,
    status text check (status in ('draft', 'published', 'archived')) default 'draft',
    tags text[] default '{}',
    metadata jsonb default '{}'::jsonb,
    search_vector tsvector generated always as (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
    ) stored,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    created_by uuid references public.profiles(id) on delete set null,
    updated_by uuid references public.profiles(id) on delete set null,
    approved_by uuid references public.profiles(id) on delete set null,
    version integer default 1
);

-- Create AI metrics tables
create table public.ai_metrics (
    id uuid default gen_random_uuid() primary key,
    trace_id text not null,
    ticket_id uuid references public.tickets(id) on delete cascade,
    type text not null check (type in ('kra', 'rgqs')),
    score float not null check (score >= 0 and score <= 1),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    created_by uuid references public.profiles(id) on delete set null
);

create table public.kb_embeddings (
    id bigint generated always as identity primary key,
    article_id uuid references public.kb_articles(id) on delete cascade,
    content text not null,
    embedding vector(1536) not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Create interactions table
create table public.interactions (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.customers(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete set null,
    type text not null,
    content text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Create indexes
create index customers_email_idx on public.customers (email);
create index customers_phone_idx on public.customers (phone);
create index tickets_customer_id_idx on public.tickets(customer_id);
create index tickets_assigned_to_idx on public.tickets(assigned_to);
create index tickets_created_by_idx on public.tickets(created_by);
create index tickets_status_idx on public.tickets(status);
create index tickets_priority_idx on public.tickets(priority);
create index ticket_messages_ticket_id_idx on public.ticket_messages(ticket_id);
create index kb_categories_slug_idx on public.kb_categories (slug);
create index kb_articles_slug_idx on public.kb_articles (slug);
create index kb_articles_category_id_idx on public.kb_articles (category_id);
create index kb_articles_search_idx on public.kb_articles using gin(search_vector);
create index kb_articles_title_trgm_idx on public.kb_articles using gin(title gin_trgm_ops);
create index kb_articles_content_trgm_idx on public.kb_articles using gin(content gin_trgm_ops);
create index ai_metrics_ticket_id_idx on public.ai_metrics(ticket_id);
create index ai_metrics_type_idx on public.ai_metrics(type);
create index ai_metrics_created_at_idx on public.ai_metrics(created_at);
create index kb_embeddings_embedding_idx on public.kb_embeddings 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Add interactions index
create index interactions_customer_id_idx on public.interactions(customer_id);
create index interactions_user_id_idx on public.interactions(user_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_feedback enable row level security;
alter table public.kb_categories enable row level security;
alter table public.kb_tags enable row level security;
alter table public.kb_articles enable row level security;
alter table public.ai_metrics enable row level security;
alter table public.kb_embeddings enable row level security;
alter table public.interactions enable row level security;

-- Add RLS policies (continued in next migration) 