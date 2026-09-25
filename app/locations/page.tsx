import { requireAuth } from '@/features/auth/auth-helpers';
import { getSavedLocations, getLocationStats } from '@/features/locations/location-queries';
import LocationsManager from '@/features/locations/components/LocationsManager/LocationsManager';
import PageBackdrop from '@/shared/ui/PageBackdrop';

export default async function LocationsPage() {
  const user = await requireAuth();
  const locations = await getSavedLocations(user.id);
  const stats = await getLocationStats(
    user.id,
    locations.map((l) => l.name),
  );

  return (
    <PageBackdrop showUpper={false}>
      <div className='max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)] py-6 flex flex-col gap-5'>
        <LocationsManager initial={locations} stats={stats} />
      </div>
    </PageBackdrop>
  );
}
