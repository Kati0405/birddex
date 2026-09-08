import Link from 'next/link';
import type { Bird } from '@/entities/bird-domain';
import BirdCard from '@/features/birds/components/BirdCard/BirdCard';
import BirdCardMini from '@/features/birds/components/BirdCardMini';
import type { SavedLocation } from '@/features/locations/location-queries';

interface Props {
  birds: Bird[];
  rareBird: Bird | null;
  savedLocations: SavedLocation[];
}

export default function ContinueCollection({
  birds,
  rareBird,
  savedLocations,
}: Props) {
  if (birds.length === 0 && !rareBird) return null;

  const gridBirds = birds.slice(0, 3);

  return (
    <section>
      <div className='flex items-end justify-between gap-4 mb-4'>
        <h2 className='font-heading text-xl font-bold text-foreground'>
          Continue your collection
        </h2>
        <Link
          href='/birds'
          className='font-mono text-[10px] uppercase tracking-[0.15em] text-primary no-underline hover:underline whitespace-nowrap'
        >
          All birds &rarr;
        </Link>
      </div>

      <div
        className='flex gap-4 lg:grid lg:grid-cols-4 lg:gap-8'
        style={{ '--mini-card-w': '120px' } as React.CSSProperties}
      >
        {birds.length > 0 && (
          <div className='min-w-0 flex-1 lg:col-span-3 rounded-xl border border-border bg-card p-4'>
            <p className='font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3'>
              Easy to spot
            </p>
            <div className='flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 lg:hidden'>
              {birds.map((bird) => (
                <Link
                  key={bird.id}
                  href={`/birds/${bird.id}`}
                  className='block w-(--mini-card-w) shrink-0'
                >
                  <BirdCardMini bird={bird} hideAttribution />
                </Link>
              ))}
            </div>
            <div className='hidden lg:grid lg:grid-cols-3 gap-4'>
              {gridBirds.map((bird) => (
                <div key={bird.id} className='h-[420px]'>
                  <BirdCard
                    bird={bird}
                    isAuthenticated
                    savedLocations={savedLocations}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {rareBird && (
          <div className='w-fit shrink-0 rounded-xl border border-border bg-card p-4'>
            <p className='font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3'>
              Worth the search
            </p>
            <Link href={`/birds/${rareBird.id}`} className='block w-(--mini-card-w) lg:hidden'>
              <BirdCardMini bird={rareBird} hideAttribution />
            </Link>
            <div className='hidden lg:block h-[420px] -mx-2'>
              <BirdCard
                bird={rareBird}
                isAuthenticated
                savedLocations={savedLocations}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
