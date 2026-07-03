'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/auth-helpers';
import { toggleCollected } from '@/features/collection/collection-queries';

export async function toggleCollectedAction(
  birdId: number
): Promise<{ collected: boolean } | { error: string }> {
  const user = await requireAuth();

  try {
    const result = await toggleCollected(user.id, birdId);
    revalidatePath('/[locale]/birds', 'page');
    revalidatePath('/[locale]/birds/[id]', 'page');
    return result;
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
