'use server';

import { headers } from 'next/headers';
import { redirect as redirectExternal } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
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

  if (error || !data.url) {
    const locale = await getLocale();
    redirect({ href: '/login?error=oauth', locale });
    return;
  }

  redirectExternal(data.url);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: '/login', locale });
}
