import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getUser } from '@/features/auth/auth-helpers';
import { buildUserContext } from '@/features/bird-guide/bird-guide-context';
import AskRobinFull from '@/features/bird-guide/components/AskRobinFull/AskRobinFull';
import { locales, type Locale } from '@/i18n/locales';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AskRobinPage' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
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
