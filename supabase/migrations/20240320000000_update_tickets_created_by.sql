-- Update the created_by reference to point to profiles instead of auth.users
alter table public.tickets 
drop constraint if exists tickets_created_by_fkey,
add constraint tickets_created_by_fkey 
    foreign key (created_by) 
    references public.profiles(id) 
    on delete set null; 