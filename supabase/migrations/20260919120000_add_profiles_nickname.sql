alter table public.profiles
  add column if not exists nickname text;

alter table public.profiles
  add constraint profiles_nickname_format check (
    nickname is null or nickname ~ '^[a-zA-Z0-9_]{3,20}$'
  );

create unique index if not exists profiles_nickname_lower_key
  on public.profiles (lower(nickname))
  where nickname is not null;
