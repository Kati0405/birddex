'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { uploadCloudinaryBuffer, deleteCloudinaryAsset } from '@/shared/lib/cloudinary';
import { toCloudinaryResourceType } from '@/shared/lib/cloudinary-utils';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { getBirdById, updateBirdCloudinaryImage } from '@/features/birds/bird-queries';

const UploadBirdImageSchema = z
  .object({
    birdId: z.coerce.number().int().positive(),
    author: z.string().trim().max(200),
    sourceUrl: z.union([z.literal(''), z.string().trim().max(500).url().regex(/^https?:\/\//i)]),
  })
  .refine((v) => !v.sourceUrl || v.author, { message: 'Add the author name to credit the photo' });

export async function uploadBirdImageAction(formData: FormData) {
  await requireAdmin();

  const file = formData.get('file') as File | null;
  if (!file) return { error: 'Missing file' };

  const parsed = UploadBirdImageSchema.safeParse({
    birdId: formData.get('birdId'),
    author: formData.get('author') ?? '',
    sourceUrl: formData.get('sourceUrl') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { birdId, author, sourceUrl } = parsed.data;

  const existing = await getBirdById(birdId);
  const prevPublicId = existing?.image_public_id;
  const prevResourceType = existing?.image_resource_type;
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploaded = await uploadCloudinaryBuffer(buffer, { folder: 'birddex', resource_type: 'image' });

  const attribution = author
    ? { imageUrl: uploaded.secure_url, thumbnailUrl: uploaded.secure_url, author, sourceUrl: sourceUrl || undefined }
    : null;

  try {
    await updateBirdCloudinaryImage(birdId, uploaded.secure_url, uploaded.public_id, attribution);
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
