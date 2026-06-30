-- Add sound recording support to birds
-- Run in Supabase SQL Editor

ALTER TABLE public.birds
  ADD COLUMN IF NOT EXISTS sound_url text;
