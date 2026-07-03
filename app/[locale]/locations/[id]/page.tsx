import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { requireAuth } from '@/features/auth/auth-helpers';
import {
  getSavedLocationById,
  getLocationDetailStats,
  getLocationObservations,
} from '@/features/locations/location-queries';
import LocationDetail from '@/features/locations/components/LocationDetail/LocationDetail';
import { locales, type Locale } from '@/i18n/locales';
import { Link } from '@/i18n/navigation';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const location = await getSavedLocationById(Number(id)).catch(() => null);
  if (!location) return { title: 'Location not found — BirdDex' };
  return { title: `${location.name} — BirdDex` };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await requireAuth();
  const location = await getSavedLocationById(Number(id));
  if (!location) notFound();

  const [detailStats, observations] = await Promise.all([
    getLocationDetailStats(user.id, location.name),
    getLocationObservations(user.id, location.name),
  ]);

  return (
    <main className='min-h-screen bg-background'>
      <div className='max-w-screen-md mx-auto px-6 py-8'>
        <Link
          href='/locations'
          className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4'
        >
          &larr; Back to locations
        </Link>
        <LocationDetail
          location={location}
          stats={detailStats}
          observations={observations}
        />
      </div>
    </main>
  );
}
