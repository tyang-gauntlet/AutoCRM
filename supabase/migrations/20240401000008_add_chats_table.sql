-- Create chats table
create table public.chats (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    status text not null default 'active' check (status in ('active', 'resolved', 'closed')),
    resolution text,
    satisfaction_level text check (satisfaction_level in ('satisfied', 'partially_satisfied', 'unsatisfied')),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    resolved_at timestamptz
);

-- Create chat_messages table
create table public.chat_messages (
    id uuid default gen_random_uuid() primary key,
    chat_id uuid references public.chats(id) on delete cascade not null,
    content text not null,
    sender_id uuid references public.profiles(id) on delete set null,
    is_ai boolean default false,
    tool_calls jsonb[] default array[]::jsonb[],
    context_used jsonb default '{}'::jsonb,
    metrics jsonb default '{}'::jsonb,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Create indexes
create index chats_user_id_idx on public.chats(user_id);
create index chats_status_idx on public.chats(status);
create index chat_messages_chat_id_idx on public.chat_messages(chat_id);
create index chat_messages_sender_id_idx on public.chat_messages(sender_id);

-- Add updated_at trigger for chats table
create trigger update_chats_updated_at
    before update on public.chats
    for each row
    execute function update_updated_at_column();

-- Add RLS policies
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;

-- Policies for chats table
create policy "Users can view their own chats"
    on public.chats for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can create their own chats"
    on public.chats for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own chats"
    on public.chats for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Policies for chat_messages table
create policy "Users can view messages from their chats"
    on public.chat_messages for select
    to authenticated
    using (
        exists (
            select 1 from public.chats
            where id = chat_messages.chat_id
            and user_id = auth.uid()
        )
    );

create policy "Users can insert messages to their chats"
    on public.chat_messages for insert
    to authenticated
    with check (
        exists (
            select 1 from public.chats
            where id = chat_messages.chat_id
            and user_id = auth.uid()
        )
    );

-- Allow admins and AI service accounts full access
create policy "Admins have full access to chats"
    on public.chats for all
    to authenticated
    using (get_user_role(auth.uid()) = 'admin')
    with check (get_user_role(auth.uid()) = 'admin');

create policy "Admins have full access to chat messages"
    on public.chat_messages for all
    to authenticated
    using (get_user_role(auth.uid()) = 'admin')
    with check (get_user_role(auth.uid()) = 'admin');

-- Add GIN indexes for JSONB columns
create index chat_messages_tool_calls_idx on public.chat_messages using gin(tool_calls);
create index chat_messages_context_used_idx on public.chat_messages using gin(context_used);
create index chat_messages_metrics_idx on public.chat_messages using gin(metrics);
create index chat_messages_metadata_idx on public.chat_messages using gin(metadata);
create index chats_metadata_idx on public.chats using gin(metadata); 