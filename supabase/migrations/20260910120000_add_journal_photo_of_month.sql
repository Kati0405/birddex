create table if not exists public.journal_photo_of_month (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null,
  observation_id uuid not null references public.observations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, month_key)
);

alter table public.journal_photo_of_month enable row level security;

drop policy if exists "Own photo of month" on public.journal_photo_of_month;
create policy "Own photo of month" on public.journal_photo_of_month
  for all using (auth.uid() = user_id);
