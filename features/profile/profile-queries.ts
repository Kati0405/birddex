import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import type { User } from '@supabase/supabase-js';

export async function getNickname(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', userId)
    .single();

  return (data?.nickname as string | null) ?? null;
}

export async function setNickname(userId: string, nickname: string | null): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({ nickname })
    .eq('id', userId);

  if (error) {
    throw new Error(`setNickname: ${error.message}`);
  }
}

export function getDisplayName(user: Pick<User, 'user_metadata' | 'email'>, nickname: string | null): string {
  return nickname ?? user.user_metadata?.full_name ?? user.email ?? 'Unknown';
}
