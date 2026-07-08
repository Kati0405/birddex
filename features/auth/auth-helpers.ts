import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import type { User } from '@supabase/supabase-js';

export async function getUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserRole(): Promise<'admin' | 'user' | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (data?.role as 'admin' | 'user') ?? 'user';
}

export async function requireAuth(): Promise<User> {
  const user = await getUser();
  if (!user) {
    const locale = await getLocale();
    redirect({ href: '/login', locale });
    throw new Error('Unreachable');
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: '/login', locale });
    throw new Error('Unreachable');
  }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (data?.role !== 'admin') {
    redirect({ href: '/birds', locale });
    throw new Error('Unreachable');
  }
  return user;
}
