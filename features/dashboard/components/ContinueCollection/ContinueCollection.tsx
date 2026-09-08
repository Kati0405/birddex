import Link from 'next/link';
import type { Bird } from '@/entities/bird-domain';
import BirdCard from '@/features/birds/components/BirdCard/BirdCard';
import type { SavedLocation } from '@/features/locations/location-queries';

interface Props {
  birds: Bird[];
  savedLocations: SavedLocation[];
}

export default function ContinueCollection({ birds, savedLocations }: Props) {
  if (birds.length === 0) return null;

  return (
    <section>
      <div className='flex items-end justify-between gap-4 mb-4'>
        <h2 className='font-heading text-xl font-bold text-foreground'>Continue your collection</h2>
        <Link
          href='/birds'
          className='font-mono text-[10px] uppercase tracking-[0.15em] text-primary no-underline hover:underline whitespace-nowrap'
        >
          All birds &rarr;
        </Link>
      </div>

      <div className='flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0'>
        {birds.map((bird) => (
          <div key={bird.id} className='w-[80vw] shrink-0 sm:w-auto sm:shrink h-[580px] sm:h-[420px]'>
            <BirdCard bird={bird} isAuthenticated savedLocations={savedLocations} />
          </div>
        ))}
      </div>
    </section>
  );
}
