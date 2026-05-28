import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import { requireAuth } from '@/features/auth/auth-helpers';

export async function addObservation(
  birdId: number,
  observedAt: Date,
  lat: number | null,
  lng: number | null,
): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  await supabase.from('observations').insert({
    user_id: user.id,
    bird_id: birdId,
    observed_at: observedAt.toISOString(),
    lat,
    lng,
  });
}

export async function getObservedBirdIds(userId: string): Promise<number[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('observations')
    .select('bird_id')
    .eq('user_id', userId);
  const ids = (data ?? []).map((r) => r.bird_id as number);
  return [...new Set(ids)];
}

export async function getObservationCount(userId: string): Promise<number> {
  const ids = await getObservedBirdIds(userId);
  return ids.length;
}
