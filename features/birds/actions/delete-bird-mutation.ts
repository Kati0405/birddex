'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getBirdById, deleteBird, BirdHasObservationsError } from '@/features/birds/bird-queries';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { cloudinary } from '@/shared/lib/cloudinary';
import { isCloudinaryUrl, cloudinaryPublicId } from '@/shared/lib/cloudinary-utils';

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
  const imageUrl = existing?.selected_image?.imageUrl ?? existing?.image_url;

  try {
    await deleteBird(birdId);
  } catch (e) {
    if (e instanceof BirdHasObservationsError) {
      return { error: 'This bird has observations logged against it and cannot be deleted. Remove those observations first.' };
    }
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  if (imageUrl && isCloudinaryUrl(imageUrl)) {
    await cloudinary.uploader.destroy(cloudinaryPublicId(imageUrl)).catch(() => {});
  }

  revalidatePath('/birds');
  return { success: true };
}
