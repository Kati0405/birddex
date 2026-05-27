import type { Bird } from '@/lib/types';
import BirdCard from './BirdCard';

export default function BirdGrid({ birds, isAdmin = false }: { birds: Bird[]; isAdmin?: boolean }) {
  if (birds.length === 0) {
    return (
      <p className="col-span-full text-center text-muted-foreground py-16">
        No birds match your search.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {birds.map((bird) => (
        <BirdCard key={bird.id} bird={bird} isAdmin={isAdmin} />
      ))}
    </div>
  );
}
