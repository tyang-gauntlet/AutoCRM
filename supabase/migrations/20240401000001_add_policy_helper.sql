-- Function to get RLS policies for a table
create or replace function get_policies(table_name text)
returns table (
    policyname name,
    permissive text,
    roles name[],
    cmd text,
    qual text,
    with_check text
)
security definer
set search_path = public
language plpgsql
as $$
begin
    return query
    select 
        p.policyname,
        p.permissive,
        p.roles,
        p.cmd,
        p.qual::text,
        p.with_check::text
    from pg_policy p
    join pg_class c on p.polrelid = c.oid
    join pg_namespace n on c.relnamespace = n.oid
    where n.nspname = 'public'
    and c.relname = table_name;
end;
$$; 