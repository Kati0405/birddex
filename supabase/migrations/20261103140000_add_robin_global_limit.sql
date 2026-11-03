create table if not exists public.robin_usage_global (
  day date primary key default current_date,
  count integer not null default 0
);

-- No policies: only consume_robin_quota (security definer) touches this table.
alter table public.robin_usage_global enable row level security;

drop function if exists public.consume_robin_quota(integer);

-- Atomic check-and-increment of the global and per-user daily counters.
-- Returns 'ok', 'global_limit' or 'user_limit'; the global slot is released
-- again when the per-user limit rejects the request.
create or replace function public.consume_robin_quota(max_per_user integer, max_global integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  insert into public.robin_usage_global (day, count)
  values (current_date, 1)
  on conflict (day)
  do update set count = public.robin_usage_global.count + 1
  where public.robin_usage_global.count < max_global
  returning count into used;

  if used is null then
    return 'global_limit';
  end if;

  used := null;
  insert into public.robin_usage (user_id, day, count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, day)
  do update set count = public.robin_usage.count + 1
  where public.robin_usage.count < max_per_user
  returning count into used;

  if used is null then
    update public.robin_usage_global
    set count = public.robin_usage_global.count - 1
    where day = current_date;
    return 'user_limit';
  end if;

  return 'ok';
end;
$$;

revoke all on function public.consume_robin_quota(integer, integer) from public, anon;
grant execute on function public.consume_robin_quota(integer, integer) to authenticated;
