alter table public.observations
  add column if not exists share_slug text;

create unique index if not exists observations_share_slug_key
  on public.observations (share_slug)
  where share_slug is not null;
