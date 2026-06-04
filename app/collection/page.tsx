import { requireAuth, getUserRole } from '@/features/auth/auth-helpers';
import { getObservedBirdIds, getCollectionCardDataByBirdIds } from '@/features/observations/observation-queries';
import { getBirdsByIds } from '@/features/birds/bird-queries';
import { getSavedLocations } from '@/features/locations/location-queries';
import BirdGrid from '@/features/birds/components/BirdGrid/BirdGrid';

export default async function CollectionPage() {
  const user = await requireAuth();
  const [role, observedIds, savedLocations] = await Promise.all([
    getUserRole(),
    getObservedBirdIds(user.id),
    getSavedLocations(),
  ]);
  const [birds, collectionDataByBirdId] = await Promise.all([
    getBirdsByIds(observedIds),
    getCollectionCardDataByBirdIds(user.id, observedIds),
  ]);

  return (
    <main className='min-h-screen bg-background flex'>
      {/* Spacer matching the catalog sidebar width so the grid columns are the same size */}
      <div className='hidden md:block w-64 shrink-0 border-r border-border' />
      <div className='flex-1 px-4 md:px-6 py-5'>
        <p className='mb-4 text-[10px] text-muted-foreground tracking-widest uppercase font-mono'>
          {birds.length === 0
            ? 'No birds observed yet'
            : `${birds.length} ${birds.length === 1 ? 'species' : 'species'} collected`}
        </p>

        <BirdGrid
          birds={birds}
          isAdmin={role === 'admin'}
          isAuthenticated
          observedIds={observedIds}
          savedLocations={savedLocations}
          collectionDataByBirdId={collectionDataByBirdId}
        />
      </div>
    </main>
  );
}
