import { Bird, Binoculars, CalendarDays, Camera } from 'lucide-react';
import type { JournalMonthStats } from '@/features/observations/journal-queries';

interface Props {
  stats: JournalMonthStats;
}

export default function JournalStats({ stats }: Props) {
  const items = [
    { label: 'species', value: stats.speciesCount, Icon: Bird },
    { label: 'observations', value: stats.observationCount, Icon: Binoculars },
    {
      label: 'days with sightings',
      value: stats.daysWithSightings,
      Icon: CalendarDays,
    },
    { label: 'photos added', value: stats.photosAddedCount, Icon: Camera },
  ];

  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border rounded-xl border border-border bg-card overflow-hidden'>
      {items.map(({ label, value, Icon }) => (
        <div key={label} className='flex items-center gap-3 px-4 py-4'>
          <span className='flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary'>
            <Icon className='h-5 w-5' aria-hidden='true' />
          </span>
          <span>
            <span className='block font-heading text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-none'>
              {value}
            </span>
            <span className='block text-xs text-muted-foreground mt-0.5'>
              {label}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
