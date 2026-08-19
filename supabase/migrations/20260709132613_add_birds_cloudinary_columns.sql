-- Add Cloudinary asset tracking to birds, so image/sound cleanup no longer
-- depends on regex-parsing the stored image_url/sound_url string.
ALTER TABLE birds
ADD COLUMN IF NOT EXISTS image_public_id text,
ADD COLUMN IF NOT EXISTS image_resource_type text DEFAULT 'image',
ADD COLUMN IF NOT EXISTS sound_public_id text,
ADD COLUMN IF NOT EXISTS sound_resource_type text DEFAULT 'video';
