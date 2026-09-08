import Link from 'next/link';
import { Bird } from 'lucide-react';
import ObservationRow from '@/features/observations/components/ObservationRow/ObservationRow';
import type { UserObservation } from '@/features/observations/observation-queries';

export default function RecentObservations({
  observations,
}: {
  observations: UserObservation[];
}) {
  return (
    <div className='h-full rounded-xl border border-border bg-card flex flex-col'>
      <div className='px-4 sm:px-5 pt-4 sm:pt-5 pb-1'>
        <div className='flex items-center justify-between gap-4'>
          <h2 className='font-heading text-lg font-bold text-card-foreground'>
            Recent observations
          </h2>

          <Link
            href='/observations'
            className='font-mono text-[10px] uppercase tracking-[0.15em] text-primary no-underline hover:underline whitespace-nowrap'
          >
            All observations &rarr;
          </Link>
        </div>
        <p className='text-xs text-muted-foreground'>
          The latest additions to your birding story.
        </p>
      </div>
      {observations.length === 0 ? (
        <div className='flex-1 flex flex-col items-center justify-center text-center px-6 py-8'>
          <Bird className='h-7 w-7 text-muted-foreground/20 mb-2' />
          <p className='text-sm text-muted-foreground'>
            Your recent observations will appear here.
          </p>
        </div>
      ) : (
        <div className='divide-y divide-border mt-2'>
          {observations.map((o) => (
            <ObservationRow key={o.id} observation={o} />
          ))}
        </div>
      )}
    </div>
  );
}
