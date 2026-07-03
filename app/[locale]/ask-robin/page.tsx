import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getUser } from '@/features/auth/auth-helpers';
import { buildUserContext } from '@/features/bird-guide/bird-guide-context';
import AskRobinFull from '@/features/bird-guide/components/AskRobinFull/AskRobinFull';
import { locales, type Locale } from '@/i18n/locales';

export const metadata: Metadata = {
  title: 'BirdDex — Ask Robin',
  description: 'Ask Robin anything about birds. Logged-in users get answers based on their own observations.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AskRobinPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getUser();
  const userContext = user ? await buildUserContext(user.id) : null;

  return (
    <main className="flex flex-col flex-1">
      <AskRobinFull userContext={userContext} />
    </main>
  );
}
