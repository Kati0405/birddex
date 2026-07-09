-- Add Cloudinary asset tracking to observations, so photos can be cleaned up on delete/replace
-- Run in Supabase SQL Editor

ALTER TABLE public.observations
  ADD COLUMN IF NOT EXISTS cloudinary_public_id text,
  ADD COLUMN IF NOT EXISTS cloudinary_resource_type text;
