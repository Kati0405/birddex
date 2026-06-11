import type { Metadata } from 'next';
import { getBirds } from '@/features/birds/bird-queries';
import BirdSearch from '@/features/birds/components/BirdSearch/BirdSearch';
import { getUser, getUserRole } from '@/features/auth/auth-helpers';
import { getObservedBirdIds, getCollectionCardDataByBirdIds } from '@/features/observations/observation-queries';
import { getSavedLocations } from '@/features/locations/location-queries';

export const metadata: Metadata = {
  title: 'BirdDex — Birds',
  description: 'A collectible field guide to birds, each with a personality.',
};

export default async function BirdsPage() {
  const [birds, role, user] = await Promise.all([getBirds(), getUserRole(), getUser()]);
  const [observedIds, savedLocations] = await Promise.all([
    user ? getObservedBirdIds(user.id) : Promise.resolve([]),
    user ? getSavedLocations(user.id) : Promise.resolve([]),
  ]);
  const collectionDataByBirdId = user && observedIds.length > 0
    ? await getCollectionCardDataByBirdIds(user.id, observedIds)
    : {};

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <BirdSearch
        birds={birds}
        isAdmin={role === 'admin'}
        isAuthenticated={!!user}
        observedIds={observedIds}
        savedLocations={savedLocations}
        collectionDataByBirdId={collectionDataByBirdId}
      />
    </main>
  );
}
