-- Create updated_at trigger function if it doesn't exist
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create tickets table
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  customer_id uuid references public.customers(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  ai_handled boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create ticket_messages table for conversation history
create table public.ticket_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  content text not null,
  sender_id uuid references auth.users(id) on delete set null,
  is_ai boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- RLS policies for tickets
create policy "Users can view their own tickets or assigned tickets or reviewers can view all"
  on public.tickets for select
  using (
    auth.uid() = created_by 
    or auth.uid() = assigned_to
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and (role = 'admin' or role = 'reviewer')
    )
  );

create policy "Users can create tickets"
  on public.tickets for insert
  with check (auth.role() = 'authenticated');

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Reviewers can update any ticket" ON public.tickets;

-- Create a new update policy for tickets
CREATE POLICY "Ticket update policy"
  ON public.tickets FOR UPDATE
  USING (
    auth.uid() = created_by 
    OR auth.uid() = assigned_to
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
    )
  )
  WITH CHECK (
    auth.uid() = created_by 
    OR auth.uid() = assigned_to
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'reviewer')
    )
  );

-- RLS policies for ticket messages
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
          where id = auth.uid() and role = 'admin'
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
          where id = auth.uid() and role = 'admin'
        )
      )
    )
  );

-- Create indexes
create index tickets_customer_id_idx on public.tickets(customer_id);
create index tickets_assigned_to_idx on public.tickets(assigned_to);
create index tickets_created_by_idx on public.tickets(created_by);
create index tickets_status_idx on public.tickets(status);
create index tickets_priority_idx on public.tickets(priority);
create index ticket_messages_ticket_id_idx on public.ticket_messages(ticket_id);

-- Add trigger for updated_at
create trigger tickets_updated_at
  before update on public.tickets
  for each row
  execute function update_updated_at_column();

-- Update the assigned_to reference
ALTER TABLE public.tickets 
DROP CONSTRAINT tickets_assigned_to_fkey,
ADD CONSTRAINT tickets_assigned_to_fkey 
    FOREIGN KEY (assigned_to) 
    REFERENCES public.profiles(id) 
    ON DELETE SET NULL;

-- Update the ticket_messages table to reference profiles instead of auth.users
ALTER TABLE public.ticket_messages 
DROP CONSTRAINT ticket_messages_sender_id_fkey,
ADD CONSTRAINT ticket_messages_sender_id_fkey 
    FOREIGN KEY (sender_id) 
    REFERENCES public.profiles(id) 
    ON DELETE SET NULL; 