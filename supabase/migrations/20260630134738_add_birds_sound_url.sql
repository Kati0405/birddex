-- Add sound recording support to birds
ALTER TABLE public.birds
  ADD COLUMN IF NOT EXISTS sound_url text;
