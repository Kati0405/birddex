import { requireAuth, getUserRole } from '@/features/auth/auth-helpers';
import { getObservedBirdIds } from '@/features/observations/observation-queries';
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
  const birds = await getBirdsByIds(observedIds);

  return (
    <main className='min-h-screen bg-background'>
      <div className='max-w-screen-xl mx-auto px-6 py-8'>
        <div className='mb-6'>
          <h1 className='text-xl font-semibold font-heading text-foreground'>
            My Collection
          </h1>
          <p className='text-xs mt-1 text-muted-foreground'>
            {birds.length === 0
              ? 'No birds observed yet. Head to the catalog and start logging sightings.'
              : `${birds.length} ${birds.length === 1 ? 'species' : 'species'} observed`}
          </p>
        </div>

        <BirdGrid
          birds={birds}
          isAdmin={role === 'admin'}
          isAuthenticated
          observedIds={observedIds}
          savedLocations={savedLocations}
        />
      </div>
    </main>
  );
}
