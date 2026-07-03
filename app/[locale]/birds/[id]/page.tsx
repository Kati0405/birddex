import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getBirdById } from '@/features/birds/bird-queries';
import { getUser, getUserRole } from '@/features/auth/auth-helpers';
import { getObservedBirdIds, getCollectionCardDataByBirdIds } from '@/features/observations/observation-queries';
import { getSavedLocations } from '@/features/locations/location-queries';
import BirdCard from '@/features/birds/components/BirdCard/BirdCard';
import { locales, type Locale } from '@/i18n/locales';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bird = await getBirdById(Number(id));
  if (!bird) return { title: 'Bird not found — BirdDex' };
  return {
    title: `${bird.name_eng} — BirdDex`,
    description: bird.field_note ?? `${bird.name_eng} (${bird.name_latin}) — ${bird.rarity} species.`,
  };
}

export default async function BirdPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<{ flipped?: string; obs?: string }>;
}) {
  const [{ locale, id }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const initialFlipped = sp.flipped === '1';
  const initialObsId = sp.obs ?? undefined;
  const [bird, user, role] = await Promise.all([
    getBirdById(Number(id)),
    getUser(),
    getUserRole(),
  ]);
  if (!bird) notFound();

  const isAuthenticated = !!user;
  const [observedIds, savedLocations] = await Promise.all([
    user ? getObservedBirdIds(user.id) : Promise.resolve([] as number[]),
    user ? getSavedLocations(user.id) : Promise.resolve([]),
  ]);
  const isObserved = observedIds.includes(bird.id);
  const collectionData = user && isObserved
    ? (await getCollectionCardDataByBirdIds(user.id, [bird.id]))[bird.id]
    : undefined;

  return (
    <main className='min-h-screen bg-background px-4 py-12 sm:px-8'>
      <div className='mx-auto max-w-sm'>
        <div className='aspect-[3/4]'>
          <BirdCard
            bird={bird}
            isAdmin={role === 'admin'}
            isAuthenticated={isAuthenticated}
            isObserved={isObserved}
            savedLocations={savedLocations}
            collectionData={collectionData}
            initialFlipped={initialFlipped}
            initialObsId={initialObsId}
          />
        </div>
      </div>
    </main>
  );
}
