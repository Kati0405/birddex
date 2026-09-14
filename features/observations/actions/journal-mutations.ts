'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/auth-helpers';
import { setJournalPhotoOfMonth, parseMonthKey } from '@/features/observations/journal-queries';
import { getErrorMessage } from '@/shared/lib/errors';

const SetJournalPhotoSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  observationId: z.string().uuid(),
});

export async function setJournalPhotoOfMonthAction(
  input: z.infer<typeof SetJournalPhotoSchema>,
): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth();

  const parsed = SetJournalPhotoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(', ') };

  const monthKey = parseMonthKey(parsed.data.monthKey);
  if (!monthKey) return { error: 'Invalid month' };

  try {
    await setJournalPhotoOfMonth(user.id, monthKey, parsed.data.observationId);
  } catch (e) {
    return { error: getErrorMessage(e) };
  }

  revalidatePath('/observations');
  return { success: true };
}
