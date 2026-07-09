-- Add Cloudinary asset tracking to birds, so image/sound cleanup no longer
-- depends on regex-parsing the stored image_url/sound_url string.
-- Run in Supabase SQL Editor

ALTER TABLE birds
ADD COLUMN image_public_id text,
ADD COLUMN image_resource_type text DEFAULT 'image',
ADD COLUMN sound_public_id text,
ADD COLUMN sound_resource_type text DEFAULT 'video';
