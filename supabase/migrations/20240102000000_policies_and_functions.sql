-- Profile management functions
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

-- Profile triggers
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

-- RLS Policies

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (is_admin(auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and (
      case when role is not null
        then role = (select role from public.profiles where id = auth.uid())
        else true
      end
    )
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (is_admin(auth.uid()));

-- Customers policies
create policy "Authenticated users can view customers"
  on public.customers for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert customers"
  on public.customers for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update customers"
  on public.customers for update
  using (auth.role() = 'authenticated');

create policy "Only admins can delete customers"
  on public.customers for delete
  using (is_admin(auth.uid()));

-- Tickets policies
create policy "Users can view their tickets"
  on public.tickets for select
  using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'reviewer')
    )
  );

create policy "Users can create tickets"
  on public.tickets for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('user', 'admin', 'reviewer')
    )
  );

create policy "Users can update their tickets"
  on public.tickets for update
  using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'reviewer')
    )
  );

create policy "Only admins can delete tickets"
  on public.tickets for delete
  using (is_admin(auth.uid()));

-- Ticket messages policies
create policy "Users can view messages of accessible tickets"
  on public.ticket_messages for select
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
      and (
        t.created_by = auth.uid()
        or t.assigned_to = auth.uid()
        or exists (
          select 1 from public.profiles
          where id = auth.uid() and role in ('admin', 'reviewer')
        )
      )
    )
  );

create policy "Users can create messages for accessible tickets"
  on public.ticket_messages for insert
  with check (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
      and (
        t.created_by = auth.uid()
        or t.assigned_to = auth.uid()
        or exists (
          select 1 from public.profiles
          where id = auth.uid() and role in ('admin', 'reviewer')
        )
      )
    )
  );

-- Knowledge base policies
create policy "Anyone can view published articles"
  on public.kb_articles for select
  using (status = 'published');

create policy "Staff can view all articles"
  on public.kb_articles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'reviewer')
    )
  );

create policy "Only admins can modify articles"
  on public.kb_articles for all
  using (is_admin(auth.uid()));

create policy "Anyone can view categories"
  on public.kb_categories for select
  using (true);

create policy "Only admins can modify categories"
  on public.kb_categories for all
  using (is_admin(auth.uid()));

-- AI metrics policies
create policy "Staff can view metrics"
  on public.ai_metrics for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'reviewer')
    )
  );

create policy "Service role can insert metrics"
  on public.ai_metrics for insert
  with check (
    auth.jwt() ->> 'role' = 'service_role'
    or is_admin(auth.uid())
  );

-- Enable realtime for relevant tables
alter publication supabase_realtime add table public.tickets;
alter publication supabase_realtime add table public.ticket_messages;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.ai_metrics; 