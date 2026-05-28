'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { saveLocation, deleteLocation } from '@/features/locations/location-queries';

const SaveLocationSchema = z.object({
  name: z.string().min(1).max(100),
  lat: z.number(),
  lng: z.number(),
});

const DeleteLocationSchema = z.object({
  id: z.number().int().positive(),
});

type SaveLocationInput = z.infer<typeof SaveLocationSchema>;
type DeleteLocationInput = z.infer<typeof DeleteLocationSchema>;

export async function saveLocationAction(
  input: SaveLocationInput
): Promise<{ success: true } | { error: string }> {
  const parsed = SaveLocationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().toString() };

  try {
    await saveLocation(parsed.data.name, parsed.data.lat, parsed.data.lng);
  } catch (e) {
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

  try {
    await deleteLocation(parsed.data.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  revalidatePath('/locations');
  return { success: true };
}
