import QuickAddObservationButton from '@/features/observations/components/QuickAddObservation/QuickAddObservationButton';
import type { SavedLocation } from '@/features/locations/location-queries';

function timeOfDayGreeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

interface Props {
  name: string;
  savedLocations: SavedLocation[];
}

export default function DashboardGreeting({ name, savedLocations }: Props) {
  const greeting = timeOfDayGreeting(new Date());

  return (
    <div className='flex flex-wrap items-center justify-between gap-4'>
      <div>
        <h1 className='font-heading text-2xl sm:text-3xl font-bold text-foreground'>
          {greeting}, {name}
        </h1>
        <p className='text-sm text-muted-foreground mt-1'>
          Ready for another sighting?
        </p>
      </div>
      <QuickAddObservationButton
        savedLocations={savedLocations}
        variant='inline'
        className='lg:ml-8'
      />
    </div>
  );
}
