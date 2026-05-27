import { createSupabaseServerClient } from './supabase-server';

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
