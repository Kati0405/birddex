import { requireAuth, getUserRole } from '@/features/auth/auth-helpers';
import { getObservedBirdIds } from '@/features/observations/observation-queries';
import { getBirdsByIds } from '@/features/birds/bird-queries';
import BirdGrid from '@/features/birds/components/BirdGrid/BirdGrid';

export default async function CollectionPage() {
  const user = await requireAuth();
  const role = await getUserRole();

  const observedIds = await getObservedBirdIds(user.id);
  const birds = await getBirdsByIds(observedIds);

  return (
    <main className='min-h-screen' style={{ background: 'var(--background)' }}>
      <div className='max-w-screen-xl mx-auto px-6 py-8'>
        <div className='mb-6'>
          <h1
            className='text-xl font-semibold'
            style={{ color: '#2a1808', fontFamily: 'var(--font-playfair)' }}
          >
            My Collection
          </h1>
          <p className='text-xs mt-1' style={{ color: '#8a6c44' }}>
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
        />
      </div>
    </main>
  );
}
