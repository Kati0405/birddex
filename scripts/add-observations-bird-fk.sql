-- Run once in the Supabase SQL Editor.
-- observations.bird_id had no enforced foreign key to birds.id, so deleting a
-- bird silently left orphaned observation rows behind.
-- This adds a RESTRICT constraint: deleting a bird with existing observations
-- will fail instead of orphaning data. Admin must handle/remove observations
-- (or accept the block) before a bird with history can be deleted.

alter table public.observations
  add constraint observations_bird_id_fkey
  foreign key (bird_id) references public.birds(id) on delete restrict;
