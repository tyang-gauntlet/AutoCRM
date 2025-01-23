-- Enable realtime for tickets table
alter publication supabase_realtime add table tickets;

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