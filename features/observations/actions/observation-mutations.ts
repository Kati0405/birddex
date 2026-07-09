'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  addObservation,
  updateObservation,
  deleteObservation,
  getObservationForUser,
  type ObservationQuality,
} from '@/features/observations/observation-queries';
import { uploadCloudinaryBuffer, deleteCloudinaryAsset } from '@/shared/lib/cloudinary';
import { toCloudinaryResourceType } from '@/shared/lib/cloudinary-utils';
import { requireAuth } from '@/features/auth/auth-helpers';
import { getErrorMessage } from '@/shared/lib/errors';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const ObservationFieldsSchema = z.object({
  observedAt: z.coerce.date(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  locationName: z.string().max(300).nullable().optional(),
  seen: z.boolean().default(false),
  heard: z.boolean().default(false),
  photographed: z.boolean().default(false),
  quality: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

async function uploadObservationPhoto(file: File): Promise<
  { photoUrl: string; publicId: string } | { error: string }
> {
  if (!file.type.startsWith('image/')) return { error: 'Only image files are allowed.' };
  if (file.size > MAX_PHOTO_BYTES) return { error: 'Image must be under 10 MB.' };

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const uploaded = await uploadCloudinaryBuffer(buffer, { folder: 'birddex/observations', resource_type: 'image' });
    return { photoUrl: uploaded.secure_url, publicId: uploaded.public_id };
  } catch (e) {
    return { error: getErrorMessage(e, 'Upload failed') };
  }
}

function parseObservationFields(formData: FormData) {
  return ObservationFieldsSchema.safeParse({
    observedAt: formData.get('observedAt'),
    lat: formData.get('lat') != null && formData.get('lat') !== '' ? Number(formData.get('lat')) : null,
    lng: formData.get('lng') != null && formData.get('lng') !== '' ? Number(formData.get('lng')) : null,
    locationName: formData.get('locationName') || null,
    seen: formData.get('seen') === 'true',
    heard: formData.get('heard') === 'true',
    photographed: formData.get('photographed') === 'true',
    quality: formData.get('quality') ? Number(formData.get('quality')) : null,
    notes: formData.get('notes') || null,
  });
}

export async function addObservationAction(
  formData: FormData
): Promise<{ success: true; photoUrl: string | null } | { error: string }> {
  await requireAuth();

  const parsed = parseObservationFields(formData);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(', ') };

  const birdId = Number(formData.get('birdId'));
  if (!Number.isInteger(birdId) || birdId <= 0) return { error: 'Invalid bird id' };

  const file = formData.get('file');
  let photoUrl: string | null = null;
  let photoPublicId: string | null = null;
  let photoResourceType: string | null = null;

  if (file instanceof File && file.size > 0) {
    const uploadResult = await uploadObservationPhoto(file);
    if ('error' in uploadResult) return { error: uploadResult.error };
    photoUrl = uploadResult.photoUrl;
    photoPublicId = uploadResult.publicId;
    photoResourceType = 'image';
  }

  try {
    await addObservation({
      birdId,
      observedAt: parsed.data.observedAt,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      locationName: parsed.data.locationName ?? null,
      seen: parsed.data.seen,
      heard: parsed.data.heard,
      photographed: parsed.data.photographed,
      quality: (parsed.data.quality ?? null) as ObservationQuality,
      notes: parsed.data.notes ?? null,
      photoUrl,
      photoPublicId,
      photoResourceType,
    });
  } catch (e) {
    if (photoPublicId) {
      await deleteCloudinaryAsset(photoPublicId, 'image');
    }
    return { error: getErrorMessage(e) };
  }

  revalidatePath('/');
  revalidatePath('/collection');
  return { success: true, photoUrl };
}

export async function updateObservationAction(
  formData: FormData
): Promise<{ success: true; photoUrl: string | null } | { error: string }> {
  await requireAuth();

  const id = formData.get('id');
  if (typeof id !== 'string' || !z.string().uuid().safeParse(id).success) {
    return { error: 'Invalid observation id' };
  }

  const existing = await getObservationForUser(id);
  if (!existing) return { error: 'Observation not found' };

  const parsed = parseObservationFields(formData);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', ') };

  const file = formData.get('file');
  const removePhoto = formData.get('removePhoto') === 'true';

  let photoUrl = existing.photoUrl;
  let photoPublicId = existing.photoPublicId;
  let photoResourceType = existing.photoResourceType;
  let uploadedPublicId: string | null = null;

  if (file instanceof File && file.size > 0) {
    const uploadResult = await uploadObservationPhoto(file);
    if ('error' in uploadResult) return { error: uploadResult.error };
    photoUrl = uploadResult.photoUrl;
    photoPublicId = uploadResult.publicId;
    photoResourceType = 'image';
    uploadedPublicId = uploadResult.publicId;
  } else if (removePhoto) {
    photoUrl = null;
    photoPublicId = null;
    photoResourceType = null;
  }

  try {
    await updateObservation(id, {
      observedAt: parsed.data.observedAt,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      locationName: parsed.data.locationName ?? null,
      seen: parsed.data.seen,
      heard: parsed.data.heard,
      photographed: parsed.data.photographed,
      quality: (parsed.data.quality ?? null) as ObservationQuality,
      notes: parsed.data.notes ?? null,
      photoUrl,
      photoPublicId,
      photoResourceType,
    });
  } catch (e) {
    if (uploadedPublicId) {
      await deleteCloudinaryAsset(uploadedPublicId, 'image');
    }
    return { error: getErrorMessage(e) };
  }

  const oldAssetReplaced = uploadedPublicId && existing.photoPublicId;
  const oldAssetRemoved = removePhoto && existing.photoPublicId;
  if ((oldAssetReplaced || oldAssetRemoved) && existing.photoPublicId) {
    await deleteCloudinaryAsset(existing.photoPublicId, toCloudinaryResourceType(existing.photoResourceType));
  }

  revalidatePath('/collection');
  return { success: true, photoUrl };
}

const DeleteObservationSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteObservationAction(
  input: z.infer<typeof DeleteObservationSchema>
): Promise<{ success: true } | { error: string }> {
  await requireAuth();

  const parsed = DeleteObservationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(', ') };

  const existing = await getObservationForUser(parsed.data.id);
  if (!existing) return { error: 'Observation not found' };

  try {
    await deleteObservation(parsed.data.id);
  } catch (e) {
    return { error: getErrorMessage(e) };
  }

  if (existing.photoPublicId) {
    await deleteCloudinaryAsset(existing.photoPublicId, toCloudinaryResourceType(existing.photoResourceType));
  }

  revalidatePath('/');
  revalidatePath('/collection');
  return { success: true };
}
