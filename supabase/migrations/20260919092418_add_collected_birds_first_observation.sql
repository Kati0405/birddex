alter table public.collected_birds
  add column if not exists first_observation_id uuid
    references public.observations(id) on delete set null;
