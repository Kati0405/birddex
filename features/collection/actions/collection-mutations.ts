'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/features/auth/auth-helpers';
import { createSupabaseServerClient } from '@/shared/lib/supabase-server';

export async function toggleCollectedAction(
  birdId: number
): Promise<{ collected: boolean } | { error: string }> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from('collected_birds')
    .select('bird_id')
    .eq('user_id', user.id)
    .eq('bird_id', birdId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('collected_birds')
      .delete()
      .eq('user_id', user.id)
      .eq('bird_id', birdId);

    if (error) return { error: error.message };

    revalidatePath('/');
    revalidatePath(`/birds/${birdId}`);
    return { collected: false };
  } else {
    const { error } = await supabase
      .from('collected_birds')
      .insert({ user_id: user.id, bird_id: birdId });

    if (error) return { error: error.message };

    revalidatePath('/');
    revalidatePath(`/birds/${birdId}`);
    return { collected: true };
  }
}
