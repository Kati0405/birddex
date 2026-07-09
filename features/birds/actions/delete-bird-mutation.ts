'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getBirdById, deleteBird, BirdHasObservationsError } from '@/features/birds/bird-queries';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { deleteCloudinaryAsset } from '@/shared/lib/cloudinary';
import { toCloudinaryResourceType } from '@/shared/lib/cloudinary-utils';

const DeleteBirdSchema = z.object({
  birdId: z.number().int().positive(),
});

type DeleteBirdInput = z.infer<typeof DeleteBirdSchema>;

export async function deleteBirdAction(input: DeleteBirdInput) {
  await requireAdmin();
  const parsed = DeleteBirdSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { birdId } = parsed.data;

  const existing = await getBirdById(birdId);

  try {
    await deleteBird(birdId);
  } catch (e) {
    if (e instanceof BirdHasObservationsError) {
      return { error: 'This bird has observations logged against it and cannot be deleted. Remove those observations first.' };
    }
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  if (existing?.image_public_id) {
    await deleteCloudinaryAsset(existing.image_public_id, toCloudinaryResourceType(existing.image_resource_type, 'image'));
  }
  if (existing?.sound_public_id) {
    await deleteCloudinaryAsset(existing.sound_public_id, toCloudinaryResourceType(existing.sound_resource_type, 'video'));
  }

  revalidatePath('/birds');
  return { success: true };
}
