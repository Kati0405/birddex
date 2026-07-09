'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cloudinary, uploadCloudinaryBuffer } from '@/shared/lib/cloudinary';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { getBirdById, updateBirdCloudinaryImage } from '@/features/birds/bird-queries';
import { isCloudinaryUrl, cloudinaryPublicId } from '@/shared/lib/cloudinary-utils';

export async function uploadBirdImageAction(formData: FormData) {
  await requireAdmin();

  const file = formData.get('file') as File | null;
  const birdId = Number(formData.get('birdId'));

  if (!file || !birdId) return { error: 'Missing file or birdId' };

  // Delete previous Cloudinary image if one exists
  const existing = await getBirdById(birdId);
  const prevUrl = existing?.selected_image?.imageUrl ?? existing?.image_url;
  if (prevUrl && isCloudinaryUrl(prevUrl)) {
    await cloudinary.uploader.destroy(cloudinaryPublicId(prevUrl)).catch(() => {});
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploaded = await uploadCloudinaryBuffer(buffer, { folder: 'birddex', resource_type: 'image' });

  try {
    await updateBirdCloudinaryImage(birdId, uploaded.secure_url);
  } catch (err) {
    await cloudinary.uploader.destroy(uploaded.public_id).catch(() => {});
    throw err;
  }

  revalidatePath(`/birds/${birdId}`);
  redirect(`/birds/${birdId}`);
}
