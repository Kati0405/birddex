import { createSupabaseServerClient } from '@/shared/lib/supabase-server';

export async function checkIfCollected(userId: string, birdId: number): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('collected_birds')
    .select('bird_id')
    .eq('user_id', userId)
    .eq('bird_id', birdId)
    .maybeSingle();
  return data !== null;
}

/**
 * Atomically toggles the collected state for a bird.
 * Attempts an insert; if a unique-constraint conflict (23505) occurs the row
 * already exists, so we delete it instead. This avoids the TOCTOU race that a
 * read-then-write produces under concurrent requests or double-taps.
 */
export async function toggleCollected(
  userId: string,
  birdId: number,
): Promise<{ collected: boolean }> {
  const supabase = await createSupabaseServerClient();

  const { error: insertError } = await supabase
    .from('collected_birds')
    .insert({ user_id: userId, bird_id: birdId });

  if (!insertError) return { collected: true };

  // Postgres unique-violation — row already exists, so remove it.
  if (insertError.code === '23505') {
    const { error: deleteError } = await supabase
      .from('collected_birds')
      .delete()
      .eq('user_id', userId)
      .eq('bird_id', birdId);

    if (deleteError) throw new Error(`toggleCollected delete: ${deleteError.message}`);
    return { collected: false };
  }

  throw new Error(`toggleCollected insert: ${insertError.message}`);
}

export async function getCollectedCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from('collected_birds')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}

export async function getCollectedBirdIds(userId: string): Promise<number[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('collected_birds')
    .select('bird_id')
    .eq('user_id', userId);
  return (data ?? []).map((row) => row.bird_id as number);
}
