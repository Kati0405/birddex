import type { Bird } from '@/entities/bird-domain';
import BirdCard from '@/features/birds/components/BirdCard/BirdCard';
import type { SavedLocation } from '@/features/locations/location-queries';
import type { CollectionCardData } from '@/features/observations/observation-queries';

interface BirdGridProps {
  birds: Bird[];
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  observedIds?: number[];
  savedLocations?: SavedLocation[];
  collectionDataByBirdId?: Record<number, CollectionCardData>;
}

export default function BirdGrid({
  birds,
  isAdmin = false,
  isAuthenticated = false,
  observedIds = [],
  savedLocations = [],
  collectionDataByBirdId,
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
    <div className="grid grid-cols-1 gap-6 items-stretch w-full justify-center [&>*]:h-[580px] sm:[&>*]:h-[420px] sm:grid-cols-[repeat(auto-fill,minmax(260px,320px))]">
      {birds.map((bird) => (
        <BirdCard
          key={bird.id}
          bird={bird}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          isObserved={observedSet.has(bird.id)}
          savedLocations={savedLocations}
          collectionData={collectionDataByBirdId?.[bird.id]}
        />
      ))}
    </div>
  );
}
