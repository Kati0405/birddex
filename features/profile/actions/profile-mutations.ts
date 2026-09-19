'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/auth-helpers';
import { setNickname } from '@/features/profile/profile-queries';
import { getErrorMessage } from '@/shared/lib/errors';

const NICKNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

const SetNicknameSchema = z.object({
  nickname: z
    .string()
    .trim()
    .nullable()
    .transform((v) => (v === '' ? null : v))
    .refine((v) => v === null || NICKNAME_PATTERN.test(v), {
      message: 'Use 3-20 letters, numbers, or underscores.',
    }),
});

type SetNicknameInput = z.infer<typeof SetNicknameSchema>;

export async function setNicknameAction(
  input: SetNicknameInput
): Promise<{ success: true } | { error: string }> {
  const user = await requireAuth();

  const parsed = SetNicknameSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid nickname' };

  try {
    await setNickname(user.id, parsed.data.nickname);
  } catch (e) {
    const message = getErrorMessage(e);
    if (message.includes('profiles_nickname_lower_key')) {
      return { error: 'That nickname is already taken.' };
    }
    if (message.includes('profiles_nickname_format')) {
      return { error: 'Use 3-20 letters, numbers, or underscores.' };
    }
    return { error: message };
  }

  revalidatePath('/account');
  return { success: true };
}
