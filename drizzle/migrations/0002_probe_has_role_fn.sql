create or replace function public.__probe_has(_user_id uuid, _role text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select true;
$$;