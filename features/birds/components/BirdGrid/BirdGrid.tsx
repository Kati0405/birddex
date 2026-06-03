import type { Bird } from '@/entities/bird-domain';
import BirdCard from '@/features/birds/components/BirdCard/BirdCard';
import type { SavedLocation } from '@/features/locations/location-queries';

interface BirdGridProps {
  birds: Bird[];
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  observedIds?: number[];
  savedLocations?: SavedLocation[];
}

export default function BirdGrid({
  birds,
  isAdmin = false,
  isAuthenticated = false,
  observedIds = [],
  savedLocations = [],
}: BirdGridProps) {
  if (birds.length === 0) {
    return (
      <p className="col-span-full text-center text-muted-foreground py-16">
        No birds match your search.
      </p>
    );
  }

  const observedSet = new Set(observedIds);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
      {birds.map((bird) => (
        <BirdCard
          key={bird.id}
          bird={bird}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          isObserved={observedSet.has(bird.id)}
          savedLocations={savedLocations}
        />
      ))}
    </div>
  );
}
