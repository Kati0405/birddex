-- Add photo and habitat support to saved_locations
-- Run in Supabase SQL Editor

ALTER TABLE public.saved_locations
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS photo_public_id text,
  ADD COLUMN IF NOT EXISTS habitats text[] DEFAULT '{}';
