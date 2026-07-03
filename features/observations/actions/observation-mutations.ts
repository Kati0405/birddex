'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addObservation, updateObservation, deleteObservation, type ObservationQuality } from '@/features/observations/observation-queries';
import { cloudinary } from '@/shared/lib/cloudinary';
import { requireAuth } from '@/features/auth/auth-helpers';

const AddObservationSchema = z.object({
  birdId: z.number().int().positive(),
  observedAt: z.coerce.date(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  locationName: z.string().max(300).nullable().optional(),
  seen: z.boolean().default(false),
  heard: z.boolean().default(false),
  photographed: z.boolean().default(false),
  quality: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  photoUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
});

type AddObservationInput = z.infer<typeof AddObservationSchema>;

export async function addObservationAction(
  input: AddObservationInput
): Promise<{ success: true } | { error: string }> {
  await requireAuth();

  const parsed = AddObservationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(', ') };

  try {
    await addObservation({
      birdId: parsed.data.birdId,
      observedAt: parsed.data.observedAt,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      locationName: parsed.data.locationName ?? null,
      seen: parsed.data.seen,
      heard: parsed.data.heard,
      photographed: parsed.data.photographed,
      quality: (parsed.data.quality ?? null) as ObservationQuality,
      notes: parsed.data.notes ?? null,
      photoUrl: parsed.data.photoUrl ?? null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  revalidatePath('/[locale]/birds', 'page');
  return { success: true };
}

const UpdateObservationSchema = z.object({
  id: z.string().uuid(),
  observedAt: z.coerce.date(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  locationName: z.string().max(300).nullable().optional(),
  seen: z.boolean().default(false),
  heard: z.boolean().default(false),
  photographed: z.boolean().default(false),
  quality: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  photoUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
});

type UpdateObservationInput = z.infer<typeof UpdateObservationSchema>;

export async function updateObservationAction(
  input: UpdateObservationInput
): Promise<{ success: true } | { error: string }> {
  await requireAuth();

  const parsed = UpdateObservationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', ') };

  try {
    await updateObservation(parsed.data.id, {
      observedAt: parsed.data.observedAt,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      locationName: parsed.data.locationName ?? null,
      seen: parsed.data.seen,
      heard: parsed.data.heard,
      photographed: parsed.data.photographed,
      quality: (parsed.data.quality ?? null) as ObservationQuality,
      notes: parsed.data.notes ?? null,
      photoUrl: parsed.data.photoUrl ?? null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  revalidatePath('/[locale]/birds', 'page');
  return { success: true };
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

  try {
    await deleteObservation(parsed.data.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  revalidatePath('/[locale]/birds', 'page');
  return { success: true };
}

export async function uploadObservationPhotoAction(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  await requireAuth();

  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No file provided' };

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'birddex/observations', resource_type: 'image' },
          (err, res) => {
            if (err || !res) return reject(err ?? new Error('Upload failed'));
            resolve({ secure_url: res.secure_url });
          }
        )
        .end(buffer);
    });
    return { url: result.secure_url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Upload failed' };
  }
}
