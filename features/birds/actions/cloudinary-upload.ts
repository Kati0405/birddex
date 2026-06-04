'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cloudinary } from '@/shared/lib/cloudinary';
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

  const result = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'birddex', resource_type: 'image' },
          (err, res) => {
            if (err || !res) return reject(err ?? new Error('Upload failed'));
            resolve({ secure_url: res.secure_url });
          }
        )
        .end(buffer);
    }
  );

  await updateBirdCloudinaryImage(birdId, result.secure_url);
  revalidatePath(`/birds/${birdId}`);
  redirect(`/birds/${birdId}`);
}
