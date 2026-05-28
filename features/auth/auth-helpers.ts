import { redirect } from 'next/navigation';
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
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin(): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (data?.role !== 'admin') redirect('/');
  return user;
}
