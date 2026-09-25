import QuickAddObservationButton from '@/features/observations/components/QuickAddObservation/QuickAddObservationButton';
import type { SavedLocation } from '@/features/locations/location-queries';
import PageHero from '@/shared/ui/PageHero';

interface Props {
  savedLocations: SavedLocation[];
}

export default function JournalHeader({ savedLocations }: Props) {
  return (
    <PageHero
      title='My journal'
      subtitle='Small encounters, a richer world.'
      tagline='A month to remember'
      action={
        <QuickAddObservationButton savedLocations={savedLocations} variant='inline' />
      }
    />
  );
}
