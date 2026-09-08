import Image from 'next/image';
import type { Bird } from '@/entities/bird-domain';
import type { SavedLocation } from '@/features/locations/location-queries';
import type { UserObservation } from '@/features/observations/observation-queries';
import DashboardGreeting from '@/features/dashboard/components/DashboardGreeting/DashboardGreeting';
import CollectionProgress from '@/features/dashboard/components/CollectionProgress/CollectionProgress';
import BirdSpotlight from '@/features/dashboard/components/BirdSpotlight/BirdSpotlight';
import ContinueCollection from '@/features/dashboard/components/ContinueCollection/ContinueCollection';
import RecentObservations from '@/features/dashboard/components/RecentObservations/RecentObservations';
import AskRobinPromo from '@/features/dashboard/components/AskRobinPromo/AskRobinPromo';

interface Props {
  userName: string;
  savedLocations: SavedLocation[];
  observedCount: number;
  totalBirdCount: number;
  photoCount: number;
  observationCount: number;
  savedLocationCount: number;
  rarestFind: UserObservation | null;
  latestObservation: UserObservation | null;
  birdOfTheDay: Bird | null;
  uncollectedBirds: Bird[];
  recentObservations: UserObservation[];
}

export default function DashboardPage({
  userName,
  savedLocations,
  observedCount,
  totalBirdCount,
  photoCount,
  observationCount,
  savedLocationCount,
  rarestFind,
  latestObservation,
  birdOfTheDay,
  uncollectedBirds,
  recentObservations,
}: Props) {
  return (
    <main className='relative min-h-screen bg-card overflow-hidden'>
      <Image
        src='/hero/background_upper.png'
        alt=''
        width={1916}
        height={411}
        className='absolute inset-x-0 top-0 w-full h-auto object-cover pointer-events-none select-none'
        aria-hidden='true'
      />
      <Image
        src='/hero/background_lower.png'
        alt=''
        width={1916}
        height={380}
        className='absolute inset-x-0 bottom-0 w-full h-auto object-cover pointer-events-none select-none'
        aria-hidden='true'
      />

      <div className='relative max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)] py-8 sm:py-10 flex flex-col gap-8 sm:gap-10'>
        <div className='flex flex-col gap-6 sm:gap-8'>
          <DashboardGreeting name={userName} savedLocations={savedLocations} />

          <div className='flex flex-col lg:grid lg:grid-cols-2 gap-5'>
            <div className='order-1'>
              <CollectionProgress
                observedCount={observedCount}
                totalCount={totalBirdCount}
                observationCount={observationCount}
                photoCount={photoCount}
                savedLocationCount={savedLocationCount}
                rarestFind={rarestFind}
                latestObservation={latestObservation}
              />
            </div>
            {birdOfTheDay && (
              <div className='order-2'>
                <BirdSpotlight bird={birdOfTheDay} />
              </div>
            )}
            <div className='order-3 lg:col-span-2'>
              <ContinueCollection birds={uncollectedBirds} savedLocations={savedLocations} />
            </div>
          </div>
        </div>

        <div className='grid lg:grid-cols-2 gap-5'>
          <RecentObservations observations={recentObservations} />
          <AskRobinPromo />
        </div>
      </div>
    </main>
  );
}
