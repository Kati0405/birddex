-- Prevents admins from creating duplicate bird species (same Latin name).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'birds_name_latin_unique'
  ) then
    alter table public.birds
      add constraint birds_name_latin_unique unique (name_latin);
  end if;
end $$;
