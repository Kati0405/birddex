-- Run once in the Supabase SQL Editor.
-- Prevents admins from creating duplicate bird species (same Latin name).

alter table public.birds
  add constraint birds_name_latin_unique unique (name_latin);
