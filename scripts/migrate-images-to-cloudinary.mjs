import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

cloudinary.config({
  cloud_name: 'duq91v9io',
  api_key: '894959926626576',
  api_secret: 'mo4zqYIYYuhAnFsKTbi0aoD6R_8',
});

const supabase = createClient(
  'https://rxpafqcecuborfhtskay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cGFmcWNlY3Vib3JmaHRza2F5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE3NjU0MywiZXhwIjoyMDk0NzUyNTQzfQ.qBOD4IgE5kEsylWLoxRzNRFKLNeB8V7trADnn5ZRhUE'
);

function isCloudinaryUrl(url) {
  return url.includes('res.cloudinary.com');
}

const MAX_BYTES = 9 * 1024 * 1024; // 9 MB — stay under Cloudinary's 10 MB free limit

async function uploadFromUrl(imageUrl) {
  const res = await fetch(imageUrl, {
    headers: { 'User-Agent': 'BirdDex/1.0 (https://birddex.app)' },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${imageUrl}`);
  let buffer = Buffer.from(await res.arrayBuffer());

  if (buffer.byteLength > MAX_BYTES) {
    buffer = await sharp(buffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    process.stdout.write(`(resized ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB) `);
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'birddex', resource_type: 'image' }, (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'));
        resolve(result.secure_url);
      })
      .end(buffer);
  });
}

const { data: birds, error } = await supabase
  .from('birds')
  .select('id, name_eng, image_url, selected_image')
  .in('id', [20, 24, 29, 33]) // previously failed — too large for Cloudinary free plan without resize
  .order('id');

if (error) { console.error('Failed to fetch birds:', error.message); process.exit(1); }

let migrated = 0, skipped = 0, failed = 0;

for (const bird of birds) {
  const existing = bird.selected_image ?? null;
  const url = existing?.imageUrl ?? bird.image_url ?? null;

  if (!url || isCloudinaryUrl(url)) {
    console.log(`[SKIP] ${bird.id} ${bird.name_eng} — ${!url ? 'no image' : 'already Cloudinary'}`);
    skipped++;
    continue;
  }

  process.stdout.write(`[MIGRATING] ${bird.id} ${bird.name_eng}… `);
  try {
    const cloudinaryUrl = await uploadFromUrl(url);

    // Preserve attribution metadata if it exists
    const update = existing
      ? { selected_image: { ...existing, imageUrl: cloudinaryUrl, thumbnailUrl: cloudinaryUrl } }
      : { image_url: cloudinaryUrl };

    const { error: updateError } = await supabase.from('birds').update(update).eq('id', bird.id);
    if (updateError) throw new Error(updateError.message);

    console.log(`✓ ${cloudinaryUrl.slice(0, 80)}`);
    migrated++;
  } catch (err) {
    console.log(`✗ ${err.message}`);
    failed++;
  }
}

console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}, Failed: ${failed}`);
