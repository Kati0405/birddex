import { requireAuth } from '@/features/auth/auth-helpers';
import { getSavedLocations } from '@/features/locations/location-queries';
import LocationsManager from '@/features/locations/components/LocationsManager/LocationsManager';

export default async function LocationsPage() {
  await requireAuth();
  const locations = await getSavedLocations();

  return (
    <main className='min-h-screen bg-background'>
      <div className='max-w-screen-md mx-auto px-6 py-8'>
        <div className='mb-6'>
          <h1 className='text-xl font-semibold font-heading text-foreground'>My Locations</h1>
          <p className='text-xs mt-1 text-muted-foreground'>
            Save spots you visit often and select them when logging observations.
          </p>
        </div>
        <LocationsManager initial={locations} />
      </div>
    </main>
  );
}
