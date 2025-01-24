-- Enable realtime for tickets table if not already enabled
do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'tickets'
    ) then
        alter publication supabase_realtime add table tickets;
    end if;
end $$;

-- Create a function to notify about ticket changes
create or replace function public.handle_ticket_change()
returns trigger as $$
begin
    perform pg_notify(
        'ticket_change',
        json_build_object(
            'id', NEW.id,
            'status', NEW.status,
            'priority', NEW.priority,
            'updated_at', NEW.updated_at
        )::text
    );
    return NEW;
end;
$$ language plpgsql;

-- Create trigger for ticket changes
drop trigger if exists notify_ticket_change on public.tickets;
create trigger notify_ticket_change
    after insert or update
    on public.tickets
    for each row
    execute function public.handle_ticket_change(); 