import Image from 'next/image';
import QuickAddObservationButton from '@/features/observations/components/QuickAddObservation/QuickAddObservationButton';
import type { SavedLocation } from '@/features/locations/location-queries';

interface Props {
  savedLocations: SavedLocation[];
}

export default function JournalHeader({ savedLocations }: Props) {
  return (
    <div className='relative isolate overflow-hidden rounded-2xl h-[180px] sm:h-[220px] lg:h-[260px]'>
      <Image
        src='/hero/river_bg.png'
        alt=''
        fill
        sizes='100vw'
        priority
        className='object-cover object-[60%_85%] pointer-events-none select-none'
        aria-hidden='true'
      />
      <div className='absolute inset-y-0 right-0 w-[220px] sm:w-[280px] lg:w-[340px]'>
        <Image
          src='/hero/tit.png'
          alt=''
          fill
          sizes='340px'
          priority
          className='object-contain object-right pointer-events-none select-none'
          aria-hidden='true'
        />
      </div>
      <div className='absolute inset-0 bg-gradient-to-r from-[#faf7f0]/70 via-[#faf7f0]/60 to-transparent' />

      <div className='relative z-10 h-full px-5 lg:px-40 sm:px-30 sm:px-10 py-10 flex flex-col justify-between'>
        <div>
          <h1 className='font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground'>
            My journal
          </h1>
          <p className='text-lg sm:text-base text-muted-foreground mt-1'>
            Small encounters, a richer world.
          </p>
          <p className='text-xs text-muted-foreground mt-1'>
            A month to remember
          </p>
        </div>
        <QuickAddObservationButton
          savedLocations={savedLocations}
          variant='inline'
          className='self-end'
        />
      </div>
    </div>
  );
}
