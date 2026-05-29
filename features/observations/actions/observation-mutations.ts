'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addObservation } from '@/features/observations/observation-queries';

const AddObservationSchema = z.object({
  birdId: z.number().int().positive(),
  observedAt: z.coerce.date(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

type AddObservationInput = z.infer<typeof AddObservationSchema>;

export async function addObservationAction(
  input: AddObservationInput
): Promise<{ success: true } | { error: string }> {
  const parsed = AddObservationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten().toString() };

  try {
    await addObservation(
      parsed.data.birdId,
      parsed.data.observedAt,
      parsed.data.lat ?? null,
      parsed.data.lng ?? null,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  revalidatePath('/');
  return { success: true };
}
