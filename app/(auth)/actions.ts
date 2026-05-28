'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/shared/lib/supabase-server';

export async function signInWithGoogleAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const headerStore = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    headerStore.get('origin') ??
    'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) redirect('/login?error=oauth');

  redirect(data.url);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
