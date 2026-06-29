import { requireAuth } from '@/features/auth/auth-helpers';
import { getSavedLocations, getLocationStats } from '@/features/locations/location-queries';
import LocationsManager from '@/features/locations/components/LocationsManager/LocationsManager';

export default async function LocationsPage() {
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
