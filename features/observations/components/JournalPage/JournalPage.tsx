import Image from 'next/image';
import JournalHeader from '@/features/observations/components/JournalHeader/JournalHeader';
import MonthNav from '@/features/observations/components/MonthNav/MonthNav';
import JournalStats from '@/features/observations/components/JournalStats/JournalStats';
import JournalTimeline from '@/features/observations/components/JournalTimeline/JournalTimeline';
import NewToCollection from '@/features/observations/components/JournalSidebar/NewToCollection';
import MonthPhotoHighlight from '@/features/observations/components/JournalSidebar/MonthPhotoHighlight';
import type { SavedLocation } from '@/features/locations/location-queries';
import type { JournalMonthData, JournalPhotoOption, JournalPhotoOfMonth } from '@/features/observations/journal-queries';
import { monthKeyToString, MONTH_NAMES, type MonthKey } from '@/features/observations/journal-month';

interface Props {
  monthKey: MonthKey;
  savedLocations: SavedLocation[];
  data: JournalMonthData;
  photoOfMonth: JournalPhotoOfMonth | null;
  photoOptions: JournalPhotoOption[];
}

export default function JournalPage({ monthKey, savedLocations, data, photoOfMonth, photoOptions }: Props) {
  const monthLabel = MONTH_NAMES[monthKey.month - 1];

  return (
    <main className='relative min-h-screen bg-card overflow-hidden'>
      <Image
        src='/hero/background_lower.png'
        alt=''
        width={1916}
        height={380}
        className='absolute inset-x-0 bottom-0 w-full h-auto object-cover pointer-events-none select-none'
        aria-hidden='true'
      />

      <div className='relative max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)] py-6 flex flex-col gap-5'>
        <JournalHeader savedLocations={savedLocations} />
        <MonthNav selected={monthKey} />
        <JournalStats stats={data.stats} />

        <div className='lg:hidden'>
          <NewToCollection newSpecies={data.newSpecies} />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          <div className='lg:col-span-2 min-w-0'>
            <JournalTimeline
              key={monthKeyToString(monthKey)}
              monthLabel={monthLabel}
              observations={data.observations}
              savedLocations={savedLocations}
            />
          </div>
          <div className='flex flex-col gap-5'>
            <div className='hidden lg:block'>
              <NewToCollection newSpecies={data.newSpecies} />
            </div>
            <MonthPhotoHighlight
              monthKey={monthKeyToString(monthKey)}
              monthLabel={monthLabel}
              speciesCount={data.stats.speciesCount}
              observationCount={data.stats.observationCount}
              photoOfMonth={photoOfMonth}
              photoOptions={photoOptions}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
