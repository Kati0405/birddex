'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getBirdById, updateBirdSelectedImage, updateBirdCloudinaryImage, updateBirdMetadata } from '@/features/birds/bird-queries';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { cloudinary } from '@/shared/lib/cloudinary';
import { isCloudinaryUrl, cloudinaryPublicId } from '@/shared/lib/cloudinary-utils';

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

  let uploaded;
  try {
    uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'birddex', resource_type: 'image' }, (err, res) => {
          if (err || !res) return reject(err ?? new Error('Upload failed'));
          resolve(res);
        })
        .end(buffer);
    });
  } catch (err: unknown) {
    const e = err as { http_code?: number; message?: string };
    console.error('Cloudinary upload failed:', e.http_code, e.message);
    return { error: `Cloudinary upload failed (${e.http_code ?? 'unknown'}): ${e.message ?? 'unknown error'}` };
  }

  await updateBirdSelectedImage(birdId, {
    ...selectedImage,
    imageUrl: uploaded.secure_url,
    thumbnailUrl: uploaded.secure_url,
  });
  revalidatePath(`/birds/${birdId}`);
  redirect(`/birds/${birdId}`);
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
  revalidatePath(`/birds/${birdId}`);
  revalidatePath('/');
  return { success: true };
}
