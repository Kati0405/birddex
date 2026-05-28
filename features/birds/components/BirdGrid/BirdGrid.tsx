import type { Bird } from '@/entities/bird-domain';
import BirdCard from '@/features/birds/components/BirdCard/BirdCard';

interface BirdGridProps {
  birds: Bird[];
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  observedIds?: number[];
}

export default function BirdGrid({
  birds,
  isAdmin = false,
  isAuthenticated = false,
  observedIds = [],
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {birds.map((bird) => (
        <BirdCard
          key={bird.id}
          bird={bird}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          isObserved={observedSet.has(bird.id)}
        />
      ))}
    </div>
  );
}
