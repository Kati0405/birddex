'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/auth-helpers';
import { toggleCollected } from '@/features/collection/collection-queries';
import { getErrorMessage } from '@/shared/lib/errors';

export async function toggleCollectedAction(
  birdId: number
): Promise<{ collected: boolean } | { error: string }> {
  const user = await requireAuth();

  try {
    const result = await toggleCollected(user.id, birdId);
    revalidatePath('/');
    revalidatePath(`/birds/${birdId}`);
    return result;
  } catch (e) {
    return { error: getErrorMessage(e) };
  }
}
