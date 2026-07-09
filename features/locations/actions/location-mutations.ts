'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveLocation, deleteLocation, updateLocation, updateLocationPhoto, getSavedLocationById } from '@/features/locations/location-queries';
import { uploadCloudinaryBuffer, deleteCloudinaryAsset } from '@/shared/lib/cloudinary';
import { requireAuth } from '@/features/auth/auth-helpers';
import { createSupabaseServerClient } from '@/shared/lib/supabase-server';

import { BIOMES } from '@/entities/bird-domain';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const SaveLocationFieldsSchema = z.object({
  name: z.string().min(1).max(100),
  lat: z.number(),
  lng: z.number(),
  habitats: z.array(z.enum(BIOMES as [string, ...string[]])).max(3).optional(),
});

const DeleteLocationSchema = z.object({
  id: z.number().int().positive(),
});

type DeleteLocationInput = z.infer<typeof DeleteLocationSchema>;

export async function saveLocationAction(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  await requireAuth();

  const habitatsRaw = formData.get('habitats');
  const parsed = SaveLocationFieldsSchema.safeParse({
    name: formData.get('name'),
    lat: Number(formData.get('lat')),
    lng: Number(formData.get('lng')),
    habitats: habitatsRaw ? JSON.parse(habitatsRaw as string) : undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().toString() };

  const file = formData.get('file');
  let photoUrl: string | null = null;
  let photoPublicId: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith('image/')) return { error: 'Only image files are allowed.' };
    if (file.size > MAX_PHOTO_BYTES) return { error: 'Image must be under 10 MB.' };

    const buffer = Buffer.from(await file.arrayBuffer());
    let uploaded: { secure_url: string; public_id: string };
    try {
      uploaded = await uploadCloudinaryBuffer(buffer, { folder: 'birddex/locations', resource_type: 'image' });
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Upload failed' };
    }
    photoUrl = uploaded.secure_url;
    photoPublicId = uploaded.public_id;
  }

  try {
    await saveLocation(
      parsed.data.name,
      parsed.data.lat,
      parsed.data.lng,
      photoUrl,
      photoPublicId,
      parsed.data.habitats,
    );
  } catch (e) {
    if (photoPublicId) {
      await deleteCloudinaryAsset(photoPublicId, 'image');
    }
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  revalidatePath('/locations');
  return { success: true };
}

export async function deleteLocationAction(
  input: DeleteLocationInput
): Promise<{ success: true } | { error: string }> {
  const parsed = DeleteLocationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().toString() };

  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: loc } = await supabase
    .from('saved_locations')
    .select('photo_public_id')
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
    .single();

  try {
    await deleteLocation(parsed.data.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  if (loc?.photo_public_id) {
    await deleteCloudinaryAsset(loc.photo_public_id as string, 'image');
  }

  revalidatePath('/locations');
  return { success: true };
}

const UpdateLocationSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  lat: z.number(),
  lng: z.number(),
  habitats: z.array(z.enum(BIOMES as [string, ...string[]])).max(3).optional(),
  oldName: z.string(),
});

type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>;

export async function updateLocationAction(
  input: UpdateLocationInput
): Promise<{ success: true } | { error: string }> {
  const parsed = UpdateLocationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().toString() };

  try {
    await updateLocation(
      parsed.data.id,
      {
        name: parsed.data.name,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        habitats: parsed.data.habitats ?? [],
      },
      parsed.data.oldName,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  revalidatePath('/locations');
  return { success: true };
}

export async function updateLocationPhotoAction(
  formData: FormData
): Promise<{ success: true; photoUrl: string | null } | { error: string }> {
  await requireAuth();

  const id = Number(formData.get('id'));
  if (!Number.isInteger(id) || id <= 0) return { error: 'Invalid location id' };

  const location = await getSavedLocationById(id);
  if (!location) return { error: 'Location not found' };

  const file = formData.get('file');
  const removePhoto = formData.get('remove') === 'true';

  if (!file || !(file instanceof File) || file.size === 0) {
    if (!removePhoto) return { error: 'No file provided' };

    try {
      await updateLocationPhoto(id, null, null);
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }

    if (location.photoPublicId) {
      await deleteCloudinaryAsset(location.photoPublicId, 'image');
    }

    revalidatePath('/locations');
    return { success: true, photoUrl: null };
  }

  if (!file.type.startsWith('image/')) return { error: 'Only image files are allowed.' };
  if (file.size > MAX_PHOTO_BYTES) return { error: 'Image must be under 10 MB.' };

  const buffer = Buffer.from(await file.arrayBuffer());
  let uploaded: { secure_url: string; public_id: string };
  try {
    uploaded = await uploadCloudinaryBuffer(buffer, { folder: 'birddex/locations', resource_type: 'image' });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Upload failed' };
  }

  try {
    await updateLocationPhoto(id, uploaded.secure_url, uploaded.public_id);
  } catch (e) {
    await deleteCloudinaryAsset(uploaded.public_id, 'image');
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  if (location.photoPublicId) {
    await deleteCloudinaryAsset(location.photoPublicId, 'image');
  }

  revalidatePath('/locations');
  return { success: true, photoUrl: uploaded.secure_url };
}
