'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { updateBirdSelectedImage, updateBirdMetadata } from '@/features/birds/bird-queries';
import { requireAdmin } from '@/features/auth/auth-helpers';

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

  await updateBirdSelectedImage(parsed.data.birdId, parsed.data.selectedImage);
  revalidatePath(`/birds/${parsed.data.birdId}`);
  redirect(`/birds/${parsed.data.birdId}`);
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
