'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { uploadCloudinaryBuffer, deleteCloudinaryAsset } from '@/shared/lib/cloudinary';
import { toCloudinaryResourceType } from '@/shared/lib/cloudinary-utils';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { getBirdById, updateBirdCloudinaryImage } from '@/features/birds/bird-queries';

export async function uploadBirdImageAction(formData: FormData) {
  await requireAdmin();

  const file = formData.get('file') as File | null;
  const birdId = Number(formData.get('birdId'));

  if (!file || !birdId) return { error: 'Missing file or birdId' };

  const existing = await getBirdById(birdId);
  const prevPublicId = existing?.image_public_id;
  const prevResourceType = existing?.image_resource_type;
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploaded = await uploadCloudinaryBuffer(buffer, { folder: 'birddex', resource_type: 'image' });

  try {
    await updateBirdCloudinaryImage(birdId, uploaded.secure_url, uploaded.public_id);
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
