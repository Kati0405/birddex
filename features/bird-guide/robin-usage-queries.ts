import { createSupabaseServerClient } from '@/shared/lib/supabase-server';

export type RobinQuotaResult = 'ok' | 'user_limit' | 'global_limit';

export async function consumeRobinQuota(
  maxPerUser: number,
  maxGlobal: number,
): Promise<RobinQuotaResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('consume_robin_quota', {
    max_per_user: maxPerUser,
    max_global: maxGlobal,
  });
  if (error) throw new Error(`consumeRobinQuota: ${error.message}`);
  return data as RobinQuotaResult;
}
