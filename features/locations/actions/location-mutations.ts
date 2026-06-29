'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveLocation, deleteLocation, updateLocation, updateLocationPhoto } from '@/features/locations/location-queries';
import { cloudinary } from '@/shared/lib/cloudinary';
import { requireAuth } from '@/features/auth/auth-helpers';
import { createSupabaseServerClient } from '@/shared/lib/supabase-server';

import { BIOMES } from '@/entities/bird-domain';

const SaveLocationSchema = z.object({
  name: z.string().min(1).max(100),
  lat: z.number(),
  lng: z.number(),
  photoUrl: z.string().url().nullable().optional(),
  photoPublicId: z.string().nullable().optional(),
  habitats: z.array(z.enum(BIOMES as [string, ...string[]])).max(3).optional(),
});

const DeleteLocationSchema = z.object({
  id: z.number().int().positive(),
});

type SaveLocationInput = z.infer<typeof SaveLocationSchema>;
type DeleteLocationInput = z.infer<typeof DeleteLocationSchema>;

export async function saveLocationAction(
  input: SaveLocationInput
): Promise<{ success: true } | { error: string }> {
  await requireAuth();

  const parsed = SaveLocationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().toString() };

  try {
    await saveLocation(
      parsed.data.name,
      parsed.data.lat,
      parsed.data.lng,
      parsed.data.photoUrl ?? null,
      parsed.data.photoPublicId ?? null,
      parsed.data.habitats,
    );
  } catch (e) {
    if (parsed.data.photoPublicId) {
      await cloudinary.uploader.destroy(parsed.data.photoPublicId).catch(() => {});
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
    await cloudinary.uploader.destroy(loc.photo_public_id as string).catch(() => {});
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

export async function uploadLocationPhotoAction(
  formData: FormData
): Promise<{ url: string; publicId: string } | { error: string }> {
  await requireAuth();

  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No file provided' };

  if (!file.type.startsWith('image/')) return { error: 'Only image files are allowed.' };
  if (file.size > 10 * 1024 * 1024) return { error: 'Image must be under 10 MB.' };

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'birddex/locations', resource_type: 'image' },
          (err, res) => {
            if (err || !res) return reject(err ?? new Error('Upload failed'));
            resolve({ secure_url: res.secure_url, public_id: res.public_id });
          }
        )
        .end(buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Upload failed' };
  }
}

const UpdateLocationPhotoSchema = z.object({
  id: z.number().int().positive(),
  photoUrl: z.string().url().nullable(),
  photoPublicId: z.string().nullable(),
  oldPhotoPublicId: z.string().nullable().optional(),
});

type UpdateLocationPhotoInput = z.infer<typeof UpdateLocationPhotoSchema>;

export async function updateLocationPhotoAction(
  input: UpdateLocationPhotoInput
): Promise<{ success: true } | { error: string }> {
  const parsed = UpdateLocationPhotoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().toString() };

  try {
    await updateLocationPhoto(parsed.data.id, parsed.data.photoUrl, parsed.data.photoPublicId);
  } catch (e) {
    if (parsed.data.photoPublicId) {
      await cloudinary.uploader.destroy(parsed.data.photoPublicId).catch(() => {});
    }
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  if (parsed.data.oldPhotoPublicId) {
    await cloudinary.uploader.destroy(parsed.data.oldPhotoPublicId).catch(() => {});
  }

  revalidatePath('/locations');
  return { success: true };
}
