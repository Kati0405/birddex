'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getBirdById, updateBirdSelectedImage, updateBirdCloudinaryImage, updateBirdMetadata, updateBirdSoundUrl } from '@/features/birds/bird-queries';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { cloudinary } from '@/shared/lib/cloudinary';
import { isCloudinaryUrl, cloudinaryPublicId } from '@/shared/lib/cloudinary-utils';
import { RARITIES, type Rarity } from '@/entities/bird-domain';

const WikimediaImageSchema = z.object({
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  author: z.string().min(1),
  license: z.string().min(1),
  sourceUrl: z.string().url(),
});

const UpdateBirdImageSchema = z.object({
  birdId: z.number().int().positive(),
  selectedImage: WikimediaImageSchema,
});

type UpdateBirdImageInput = z.infer<typeof UpdateBirdImageSchema>;

export async function updateBirdImageAction(input: UpdateBirdImageInput) {
  await requireAdmin();
  const parsed = UpdateBirdImageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { birdId, selectedImage } = parsed.data;

  // Delete previous Cloudinary image if one exists
  const existing = await getBirdById(birdId);
  const prevUrl = existing?.selected_image?.imageUrl ?? existing?.image_url;
  if (prevUrl && isCloudinaryUrl(prevUrl)) {
    await cloudinary.uploader.destroy(cloudinaryPublicId(prevUrl)).catch(() => {});
  }

  // Fetch the image ourselves first — Cloudinary pulling directly from Wikimedia gets 429
  const imgRes = await fetch(selectedImage.imageUrl, {
    headers: { 'User-Agent': 'BirdDex/1.0 (https://birddex.app)' },
  });
  if (!imgRes.ok) {
    return { error: `Failed to fetch image from Wikimedia (${imgRes.status})` };
  }
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  let uploaded: { secure_url: string; public_id: string };
  try {
    uploaded = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'birddex', resource_type: 'image' }, (err, res) => {
          if (err || !res) return reject(err ?? new Error('Upload failed'));
          resolve({ secure_url: res.secure_url, public_id: res.public_id });
        })
        .end(buffer);
    });
  } catch (err: unknown) {
    const e = err as { http_code?: number; message?: string };
    console.error('Cloudinary upload failed:', e.http_code, e.message);
    return { error: `Cloudinary upload failed (${e.http_code ?? 'unknown'}): ${e.message ?? 'unknown error'}` };
  }

  try {
    await updateBirdSelectedImage(birdId, {
      ...selectedImage,
      imageUrl: uploaded.secure_url,
      thumbnailUrl: uploaded.secure_url,
    });
  } catch (err) {
    await cloudinary.uploader.destroy(uploaded.public_id).catch(() => {});
    throw err;
  }

  revalidatePath('/[locale]/birds/[id]', 'page');
  redirect(`/en/birds/${birdId}`);
}

const MAX_SOUND_BYTES = 10 * 1024 * 1024;
const ALLOWED_SOUND_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/mp4'];

async function uploadSoundBuffer(buffer: Buffer) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'birddex/sounds', resource_type: 'video' }, (err, res) => {
        if (err || !res) return reject(err ?? new Error('Upload failed'));
        resolve({ secure_url: res.secure_url, public_id: res.public_id });
      })
      .end(buffer);
  });
}

async function deletePreviousSound(birdId: number) {
  const existing = await getBirdById(birdId);
  if (existing?.sound_url && isCloudinaryUrl(existing.sound_url)) {
    await cloudinary.uploader
      .destroy(cloudinaryPublicId(existing.sound_url), { resource_type: 'video' })
      .catch(() => {});
  }
}

const UpdateBirdSoundUrlSchema = z.object({
  birdId: z.number().int().positive(),
  soundUrl: z.string().url(),
});

type UpdateBirdSoundUrlInput = z.infer<typeof UpdateBirdSoundUrlSchema>;

export async function updateBirdSoundUrlAction(input: UpdateBirdSoundUrlInput) {
  await requireAdmin();
  const parsed = UpdateBirdSoundUrlSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { birdId, soundUrl } = parsed.data;

  const soundRes = await fetch(soundUrl, {
    headers: { 'User-Agent': 'BirdDex/1.0 (https://birddex.app)' },
  });
  if (!soundRes.ok) {
    return { error: `Failed to fetch sound from source (${soundRes.status})` };
  }
  const buffer = Buffer.from(await soundRes.arrayBuffer());

  await deletePreviousSound(birdId);

  let uploaded: { secure_url: string; public_id: string };
  try {
    uploaded = await uploadSoundBuffer(buffer);
  } catch (err: unknown) {
    const e = err as { http_code?: number; message?: string };
    console.error('Cloudinary sound upload failed:', e.http_code, e.message);
    return { error: `Cloudinary upload failed (${e.http_code ?? 'unknown'}): ${e.message ?? 'unknown error'}` };
  }

  try {
    await updateBirdSoundUrl(birdId, uploaded.secure_url);
  } catch (err) {
    await cloudinary.uploader.destroy(uploaded.public_id, { resource_type: 'video' }).catch(() => {});
    throw err;
  }

  revalidatePath('/[locale]/birds/[id]', 'page');
  revalidatePath('/[locale]/birds/[id]/edit', 'page');
  return { success: true, soundUrl: uploaded.secure_url };
}

export async function updateBirdSoundFileAction(formData: FormData) {
  await requireAdmin();

  const birdId = Number(formData.get('birdId'));
  if (!Number.isInteger(birdId) || birdId <= 0) return { error: 'Invalid bird id' };

  const file = formData.get('file');
  if (!(file instanceof File)) return { error: 'No file provided' };
  if (!ALLOWED_SOUND_TYPES.includes(file.type)) return { error: `Unsupported file type: ${file.type}` };
  if (file.size > MAX_SOUND_BYTES) return { error: 'File too large (max 10MB)' };

  const buffer = Buffer.from(await file.arrayBuffer());

  await deletePreviousSound(birdId);

  let uploaded: { secure_url: string; public_id: string };
  try {
    uploaded = await uploadSoundBuffer(buffer);
  } catch (err: unknown) {
    const e = err as { http_code?: number; message?: string };
    console.error('Cloudinary sound upload failed:', e.http_code, e.message);
    return { error: `Cloudinary upload failed (${e.http_code ?? 'unknown'}): ${e.message ?? 'unknown error'}` };
  }

  try {
    await updateBirdSoundUrl(birdId, uploaded.secure_url);
  } catch (err) {
    await cloudinary.uploader.destroy(uploaded.public_id, { resource_type: 'video' }).catch(() => {});
    throw err;
  }

  revalidatePath('/[locale]/birds/[id]', 'page');
  revalidatePath('/[locale]/birds/[id]/edit', 'page');
  return { success: true, soundUrl: uploaded.secure_url };
}

const FOOD_VALUES = ['insects', 'seeds', 'fish', 'rodents', 'berries', 'omnivore', 'scavenger'] as const;
const BIOME_VALUES = ['forest', 'wetlands', 'city', 'fields', 'rivers', 'mountains', 'coast', 'gardens'] as const;
const BEHAVIOUR_VALUES = [
  'nocturnal', 'predator', 'songbird', 'mimic', 'flock bird', 'urban survivor',
  'fish hunter', 'secretive', 'territorial', 'fast flyer', 'berry lover', 'forest ghost',
  'feeder visitor',
] as const;

const UpdateBirdMetadataSchema = z.object({
  birdId: z.number().int().positive(),
  rarity: z.enum(RARITIES as [Rarity, ...Rarity[]]),
  food: z.array(z.enum(FOOD_VALUES)).min(1).max(3),
  biomes: z.array(z.enum(BIOME_VALUES)).min(1).max(3),
  behaviour: z.array(z.enum(BEHAVIOUR_VALUES)).min(1).max(3),
  best_months: z.array(z.number().int().min(1).max(12)),
  field_note: z.string().max(300),
  tips_to_find: z.array(z.string().max(200)).max(4),
  field_marks: z.array(z.string().max(200)).max(4),
});

type UpdateBirdMetadataInput = z.infer<typeof UpdateBirdMetadataSchema>;

export async function updateBirdMetadataAction(input: UpdateBirdMetadataInput) {
  await requireAdmin();
  const parsed = UpdateBirdMetadataSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { birdId, ...data } = parsed.data;
  await updateBirdMetadata(birdId, data);
  revalidatePath('/[locale]/birds/[id]', 'page');
  revalidatePath('/[locale]/birds', 'page');
  return { success: true };
}
