import { setRequestLocale } from 'next-intl/server';
import { requireAuth } from '@/features/auth/auth-helpers';
import { getSavedLocations, getLocationStats } from '@/features/locations/location-queries';
import LocationsManager from '@/features/locations/components/LocationsManager/LocationsManager';
import { locales, type Locale } from '@/i18n/locales';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocationsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireAuth();
  const locations = await getSavedLocations(user.id);
  const stats = await getLocationStats(
    user.id,
    locations.map((l) => l.name),
  );

  return (
    <main className='min-h-screen bg-background'>
      <div className='max-w-screen-md mx-auto px-6 py-8'>
        <LocationsManager initial={locations} stats={stats} />
      </div>
    </main>
  );
}
