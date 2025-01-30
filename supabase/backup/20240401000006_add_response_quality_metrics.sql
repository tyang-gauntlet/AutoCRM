-- Drop existing tables if they exist
drop table if exists public.response_quality_metrics;
drop table if exists public.knowledge_retrieval_metrics;

-- Create knowledge retrieval metrics table
create table public.knowledge_retrieval_metrics (
    id uuid default gen_random_uuid() primary key,
    metric_id uuid references public.ai_metrics(id) on delete cascade,
    query_text text not null,
    retrieved_chunks jsonb default '[]'::jsonb,
    relevant_chunks jsonb default '[]'::jsonb,
    accuracy float,
    relevance_score float,
    context_match float,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Create response quality metrics table
create table public.response_quality_metrics (
    id uuid default gen_random_uuid() primary key,
    metric_id uuid references public.ai_metrics(id) on delete cascade,
    ticket_id uuid references public.tickets(id) on delete cascade,
    message_id uuid references public.ticket_messages(id) on delete cascade,
    response_text text,
    overall_quality float,
    relevance float,
    accuracy float,
    tone float,
    human_rating float,
    response_time interval,
    response_length integer,
    sentiment_score float,
    clarity_score float,
    helpfulness_score float,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Create indexes for knowledge retrieval metrics
create index knowledge_retrieval_metrics_metric_id_idx on public.knowledge_retrieval_metrics(metric_id);

-- Create indexes for response quality metrics
create index response_quality_metrics_ticket_id_idx on public.response_quality_metrics(ticket_id);
create index response_quality_metrics_message_id_idx on public.response_quality_metrics(message_id);
create index response_quality_metrics_metric_id_idx on public.response_quality_metrics(metric_id);

-- Create triggers for updated_at
create trigger update_knowledge_retrieval_metrics_updated_at
    before update on public.knowledge_retrieval_metrics
    for each row
    execute function update_updated_at_column();

create trigger update_response_quality_metrics_updated_at
    before update on public.response_quality_metrics
    for each row
    execute function update_updated_at_column();