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

-- Create profiles table (extends auth.users)
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

-- Create profile trigger function
create or replace function handle_new_user()
returns trigger as $$
declare
  user_count integer;
  assigned_role text;
begin
  raise notice 'handle_new_user triggered for user % (email: %)', NEW.id, NEW.email;
  
  -- Count existing profiles
  select count(*) into user_count from public.profiles;
  raise notice 'Current profile count: %', user_count;
  
  -- Determine role
  assigned_role := case 
    when user_count = 0 then 'admin'  -- First user becomes admin
    when NEW.email = 'admin@example.com' then 'admin'  -- Force admin email
    when NEW.raw_app_meta_data->>'role' = 'admin' then 'admin'  -- Keep admin role if set
    else 'user'
  end;
  
  raise notice 'Assigning role % to user %', assigned_role, NEW.email;

  -- Create profile with upsert
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

  raise notice 'Profile created/updated for user % with role %', NEW.email, assigned_role;

  -- Update auth.users metadata
  update auth.users
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', assigned_role)
  where id = NEW.id;

  raise notice 'Auth metadata updated for user % with role %', NEW.email, assigned_role;
  return NEW;
end;
$$ language plpgsql security definer;

-- Create profile trigger
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure handle_new_user();

-- Create customers table
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

-- Create tickets table
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

-- Create ticket messages table
create table public.ticket_messages (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references public.tickets(id) on delete cascade not null,
    content text not null,
    sender_id uuid references public.profiles(id) on delete set null,
    is_ai boolean default false,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Create ticket feedback table
create table public.ticket_feedback (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references public.tickets(id) on delete cascade not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
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
    approved_by uuid references public.profiles(id) on delete set null
);

-- Create AI-related tables
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

create table public.knowledge_retrieval_metrics (
    id uuid default gen_random_uuid() primary key,
    metric_id uuid references public.ai_metrics(id) on delete cascade,
    query_text text not null,
    retrieved_chunks jsonb not null,
    relevant_chunks jsonb not null,
    accuracy float not null check (accuracy >= 0 and accuracy <= 1),
    relevance_score float not null check (relevance_score >= 0 and relevance_score <= 1),
    context_match float not null check (context_match >= 0 and context_match <= 1),
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.response_quality_metrics (
    id uuid default gen_random_uuid() primary key,
    metric_id uuid references public.ai_metrics(id) on delete cascade,
    response_text text not null,
    overall_quality float not null check (overall_quality >= 0 and overall_quality <= 5),
    relevance float not null check (relevance >= 0 and relevance <= 5),
    accuracy float not null check (accuracy >= 0 and accuracy <= 5),
    tone float not null check (tone >= 0 and tone <= 5),
    human_rating float check (human_rating >= 0 and human_rating <= 5),
    created_at timestamptz default timezone('utc'::text, now()) not null
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

-- Add triggers for updated_at
create trigger set_timestamp
    before update on public.customers
    for each row execute function update_updated_at_column();

create trigger set_timestamp
    before update on public.tickets
    for each row execute function update_updated_at_column();

create trigger set_timestamp
    before update on public.ticket_feedback
    for each row execute function update_updated_at_column();

create trigger set_timestamp
    before update on public.interactions
    for each row execute function update_updated_at_column();

create trigger set_timestamp
    before update on public.kb_categories
    for each row execute function update_updated_at_column();

create trigger set_timestamp
    before update on public.kb_articles
    for each row execute function update_updated_at_column();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_feedback enable row level security;
alter table public.interactions enable row level security;
alter table public.kb_categories enable row level security;
alter table public.kb_tags enable row level security;
alter table public.kb_articles enable row level security;
alter table public.ai_metrics enable row level security;
alter table public.knowledge_retrieval_metrics enable row level security;
alter table public.response_quality_metrics enable row level security;