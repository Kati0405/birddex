create table if not exists public.robin_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.robin_usage enable row level security;

drop policy if exists "Own robin usage read" on public.robin_usage;
create policy "Own robin usage read" on public.robin_usage
  for select using (auth.uid() = user_id);

-- Atomic check-and-increment: returns false once the user has hit max_per_day.
create or replace function public.consume_robin_quota(max_per_day integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  insert into public.robin_usage (user_id, day, count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, day)
  do update set count = public.robin_usage.count + 1
  where public.robin_usage.count < max_per_day
  returning count into used;

  return used is not null;
end;
$$;

revoke all on function public.consume_robin_quota(integer) from public, anon;
grant execute on function public.consume_robin_quota(integer) to authenticated;
