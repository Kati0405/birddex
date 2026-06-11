import { requireAuth, getUserRole } from '@/features/auth/auth-helpers';
import { getObservedBirdIds, getCollectionCardDataByBirdIds } from '@/features/observations/observation-queries';
import { getBirdsByIds } from '@/features/birds/bird-queries';
import { getSavedLocations } from '@/features/locations/location-queries';
import CollectionSearch from '@/features/birds/components/CollectionSearch/CollectionSearch';

export default async function CollectionPage() {
  const user = await requireAuth();
  const [role, observedIds, savedLocations] = await Promise.all([
    getUserRole(),
    getObservedBirdIds(user.id),
    getSavedLocations(user.id),
  ]);
  const [birds, collectionDataByBirdId] = await Promise.all([
    getBirdsByIds(observedIds),
    getCollectionCardDataByBirdIds(user.id, observedIds),
  ]);

  return (
    <main className='min-h-screen bg-background'>
      <div className='mt-[52px] md:mt-0 py-5'>
        <CollectionSearch
          birds={birds}
          isAdmin={role === 'admin'}
          observedIds={observedIds}
          savedLocations={savedLocations}
          collectionDataByBirdId={collectionDataByBirdId}
        />
      </div>
    </main>
  );
}
