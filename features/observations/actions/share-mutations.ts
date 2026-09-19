'use server';

import { z } from 'zod';
import { requireAuth } from '@/features/auth/auth-helpers';
import { getObservationShareSlug, setObservationShareSlug } from '@/features/observations/observation-queries';
import { generateShareSlug } from '@/shared/lib/slug';
import { getErrorMessage } from '@/shared/lib/errors';

const CreateShareLinkSchema = z.object({
  observationId: z.string().uuid(),
});

export async function createObservationShareLinkAction(
  input: z.infer<typeof CreateShareLinkSchema>
): Promise<{ success: true; shareSlug: string } | { error: string }> {
  const user = await requireAuth();

  const parsed = CreateShareLinkSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(', ') };

  const existing = await getObservationShareSlug(parsed.data.observationId, user.id);
  if (!existing) return { error: 'Observation not found' };

  if (existing.shareSlug) return { success: true, shareSlug: existing.shareSlug };

  const shareSlug = generateShareSlug();
  try {
    await setObservationShareSlug(parsed.data.observationId, user.id, shareSlug);
  } catch (e) {
    return { error: getErrorMessage(e) };
  }

  return { success: true, shareSlug };
}
