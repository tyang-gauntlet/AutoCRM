-- Create AI metrics tables
create table if not exists public.ai_metrics (
    id uuid default gen_random_uuid() primary key,
    trace_id text not null,
    ticket_id uuid references public.tickets(id) on delete cascade,
    type text not null check (type in ('kra', 'rgqs')), -- Knowledge Retrieval Accuracy or Response Generation Quality Score
    score float not null check (score >= 0 and score <= 1),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    created_by uuid references public.profiles(id) on delete set null
);

-- Create detailed metrics table for KRA
create table if not exists public.knowledge_retrieval_metrics (
    id uuid default gen_random_uuid() primary key,
    metric_id uuid references public.ai_metrics(id) on delete cascade,
    query_text text not null,
    retrieved_chunks jsonb not null,
    relevant_chunks jsonb not null, -- Human labeled relevant chunks
    accuracy float not null check (accuracy >= 0 and accuracy <= 1),
    relevance_score float not null check (relevance_score >= 0 and relevance_score <= 1),
    context_match float not null check (context_match >= 0 and context_match <= 1),
    created_at timestamptz default now()
);

-- Create detailed metrics table for RGQS
create table if not exists public.response_quality_metrics (
    id uuid default gen_random_uuid() primary key,
    metric_id uuid references public.ai_metrics(id) on delete cascade,
    response_text text not null,
    overall_quality float not null check (overall_quality >= 0 and overall_quality <= 5),
    relevance float not null check (relevance >= 0 and relevance <= 5),
    accuracy float not null check (accuracy >= 0 and accuracy <= 5),
    tone float not null check (tone >= 0 and tone <= 5),
    human_rating float check (human_rating >= 0 and human_rating <= 5),
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.ai_metrics enable row level security;
alter table public.knowledge_retrieval_metrics enable row level security;
alter table public.response_quality_metrics enable row level security;

-- RLS Policies
create policy "Metrics viewable by authenticated users"
    on public.ai_metrics for select
    to authenticated
    using (true);

create policy "Metrics insertable by service role or admin"
    on public.ai_metrics for insert
    to authenticated
    with check (
        auth.jwt() ->> 'role' = 'service_role' or
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
        )
    );

-- Similar policies for detailed metrics tables
create policy "KRA metrics viewable by authenticated users"
    on public.knowledge_retrieval_metrics for select
    to authenticated
    using (true);

create policy "RGQS metrics viewable by authenticated users"
    on public.response_quality_metrics for select
    to authenticated
    using (true);

-- Add helpful functions
create or replace function get_average_metrics(
    p_ticket_id uuid,
    p_type text,
    p_timeframe interval default interval '24 hours'
)
returns table (
    avg_score float,
    count bigint
)
language sql
stable
as $$
    select
        avg(score)::float as avg_score,
        count(*) as count
    from public.ai_metrics
    where ticket_id = p_ticket_id
    and type = p_type
    and created_at > now() - p_timeframe;
$$;

-- Add indexes for better performance
create index ai_metrics_ticket_id_idx on public.ai_metrics(ticket_id);
create index ai_metrics_type_idx on public.ai_metrics(type);
create index ai_metrics_created_at_idx on public.ai_metrics(created_at);
create index knowledge_retrieval_metrics_metric_id_idx on public.knowledge_retrieval_metrics(metric_id);
create index response_quality_metrics_metric_id_idx on public.response_quality_metrics(metric_id);

-- Enable realtime for metrics tables
alter publication supabase_realtime add table public.ai_metrics;
alter publication supabase_realtime add table public.knowledge_retrieval_metrics;
alter publication supabase_realtime add table public.response_quality_metrics;

-- Add helpful comments
comment on table public.ai_metrics is 'Stores core metrics for AI operations';
comment on table public.knowledge_retrieval_metrics is 'Detailed metrics for knowledge retrieval accuracy';
comment on table public.response_quality_metrics is 'Detailed metrics for response generation quality'; 