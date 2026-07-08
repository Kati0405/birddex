import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireAuth } from '@/features/auth/auth-helpers';
import { getAllUserObservations } from '@/features/observations/observation-queries';
import ObservationList from '@/features/observations/components/ObservationList/ObservationList';
import { locales, type Locale } from '@/i18n/locales';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ObservationsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('ObservationsPage');

  await requireAuth();
  const observations = await getAllUserObservations();

  return (
    <main className='min-h-screen bg-background'>
      <div className='px-0 md:px-6 py-5'>
        <p className='mb-4 text-[10px] text-muted-foreground tracking-widest uppercase font-mono'>
          {observations.length === 0
            ? t('noObservationsYet')
            : t('observationCount', { count: observations.length })}
        </p>
        <ObservationList observations={observations} />
      </div>
    </main>
  );
}
