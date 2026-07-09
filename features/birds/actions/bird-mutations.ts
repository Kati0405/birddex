'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getBirdById, updateBirdSelectedImage, updateBirdMetadata, updateBirdSoundUrl } from '@/features/birds/bird-queries';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { uploadCloudinaryBuffer, deleteCloudinaryAsset } from '@/shared/lib/cloudinary';
import { toCloudinaryResourceType } from '@/shared/lib/cloudinary-utils';
import { RARITIES, FOODS, BIOMES, BEHAVIOURS, type Rarity, type Food, type Biome, type Behaviour } from '@/entities/bird-domain';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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

  const existing = await getBirdById(birdId);
  const prevPublicId = existing?.image_public_id;
  const prevResourceType = existing?.image_resource_type;

  // Fetch the image ourselves first — Cloudinary pulling directly from Wikimedia gets 429
  const imgRes = await fetch(selectedImage.imageUrl, {
    headers: { 'User-Agent': 'BirdDex/1.0 (https://birddex.app)' },
  });
  if (!imgRes.ok) {
    return { error: `Failed to fetch image from Wikimedia (${imgRes.status})` };
  }
  const contentType = imgRes.headers.get('content-type') ?? '';
  if (!ALLOWED_IMAGE_TYPES.includes(contentType.split(';')[0].trim())) {
    return { error: `Unsupported image type: ${contentType || 'unknown'}` };
  }
  const contentLength = Number(imgRes.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    return { error: 'Image too large (max 10MB)' };
  }
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return { error: 'Image too large (max 10MB)' };
  }

  let uploaded: { secure_url: string; public_id: string };
  try {
    uploaded = await uploadCloudinaryBuffer(buffer, { folder: 'birddex', resource_type: 'image' });
  } catch (err: unknown) {
    const e = err as { http_code?: number; message?: string };
    console.error('Cloudinary upload failed:', e.http_code, e.message);
    return { error: `Cloudinary upload failed (${e.http_code ?? 'unknown'}): ${e.message ?? 'unknown error'}` };
  }

  try {
    await updateBirdSelectedImage(
      birdId,
      {
        ...selectedImage,
        imageUrl: uploaded.secure_url,
        thumbnailUrl: uploaded.secure_url,
      },
      uploaded.public_id,
    );
  } catch (err) {
    await deleteCloudinaryAsset(uploaded.public_id, 'image');
    throw err;
  }

  if (prevPublicId) {
    await deleteCloudinaryAsset(prevPublicId, toCloudinaryResourceType(prevResourceType, 'image'));
  }

  revalidatePath(`/birds/${birdId}`);
  redirect(`/birds/${birdId}`);
}

const MAX_SOUND_BYTES = 10 * 1024 * 1024;
const ALLOWED_SOUND_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/mp4'];

async function uploadAndSaveBirdSound(
  birdId: number,
  buffer: Buffer,
): Promise<{ error: string } | { success: true; soundUrl: string }> {
  const existing = await getBirdById(birdId);
  const prevPublicId = existing?.sound_public_id;
  const prevResourceType = existing?.sound_resource_type;

  let uploaded: { secure_url: string; public_id: string };
  try {
    uploaded = await uploadCloudinaryBuffer(buffer, { folder: 'birddex/sounds', resource_type: 'video' });
  } catch (err: unknown) {
    const e = err as { http_code?: number; message?: string };
    console.error('Cloudinary sound upload failed:', e.http_code, e.message);
    return { error: `Cloudinary upload failed (${e.http_code ?? 'unknown'}): ${e.message ?? 'unknown error'}` };
  }

  try {
    await updateBirdSoundUrl(birdId, uploaded.secure_url, uploaded.public_id);
  } catch (err) {
    await deleteCloudinaryAsset(uploaded.public_id, 'video');
    throw err;
  }

  if (prevPublicId) {
    await deleteCloudinaryAsset(prevPublicId, toCloudinaryResourceType(prevResourceType, 'video'));
  }

  revalidatePath(`/birds/${birdId}`);
  revalidatePath(`/birds/${birdId}/edit`);
  return { success: true, soundUrl: uploaded.secure_url };
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

  return uploadAndSaveBirdSound(birdId, buffer);
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

  return uploadAndSaveBirdSound(birdId, buffer);
}

const UpdateBirdMetadataSchema = z.object({
  birdId: z.number().int().positive(),
  rarity: z.enum(RARITIES as [Rarity, ...Rarity[]]),
  food: z.array(z.enum(FOODS as [Food, ...Food[]])).min(1).max(3),
  biomes: z.array(z.enum(BIOMES as [Biome, ...Biome[]])).min(1).max(3),
  behaviour: z.array(z.enum(BEHAVIOURS as [Behaviour, ...Behaviour[]])).min(1).max(3),
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
  revalidatePath(`/birds/${birdId}`);
  revalidatePath('/');
  return { success: true };
}
