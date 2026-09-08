import Link from 'next/link';
import Image from 'next/image';
import { Binoculars, Camera, MapPin } from 'lucide-react';
import birdIcon from '@/entities/bird-icons/ui/bird.png';
import ObservationMiniCard from './ObservationMiniCard';
import type { UserObservation } from '@/features/observations/observation-queries';

interface Props {
  observedCount: number;
  totalCount: number;
  observationCount: number;
  photoCount: number;
  savedLocationCount: number;
  rarestFind: UserObservation | null;
  latestObservation: UserObservation | null;
}

const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CollectionProgress({
  observedCount,
  totalCount,
  observationCount,
  photoCount,
  savedLocationCount,
  rarestFind,
  latestObservation,
}: Props) {
  const progress = totalCount > 0 ? observedCount / totalCount : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className='relative h-full rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col overflow-hidden'>
      <Image
        src='/hero/woodpecker-transparent.png'
        alt=''
        width={400}
        height={400}
        className='absolute top-4 -right-10 w-72 h-auto opacity-5 pointer-events-none select-none'
        aria-hidden='true'
      />
      <div className='relative flex items-center justify-between'>
        <h2 className='font-heading text-lg font-bold text-card-foreground'>
          Your birding
        </h2>
        <Link
          href='/birds'
          className='font-mono text-[10px] uppercase tracking-[0.15em] text-primary no-underline hover:underline whitespace-nowrap'
        >
          View collection &rarr;
        </Link>
      </div>
      <p className='relative text-xs text-muted-foreground mb-4'>
        A snapshot of your sightings, photos, and discoveries.
      </p>

      <div className='relative flex items-center gap-6'>
        <div className='relative w-32 h-32 shrink-0'>
          <svg viewBox='0 0 128 128' className='w-32 h-32 -rotate-90'>
            <circle
              cx='64'
              cy='64'
              r={RADIUS}
              fill='none'
              stroke='var(--border)'
              strokeWidth='8'
            />
            <circle
              cx='64'
              cy='64'
              r={RADIUS}
              fill='none'
              stroke='var(--primary)'
              strokeWidth='8'
              strokeLinecap='round'
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className='absolute inset-0 flex flex-col items-center justify-start top-[26px]'>
            <Image
              src={birdIcon}
              alt=''
              width={20}
              height={20}
              className='opacity-60'
              aria-hidden
            />
            <span className='flex items-baseline gap-0.5 font-heading text-4xl font-bold text-card-foreground leading-none'>
              {observedCount}
              <span className='text-4xl font-normal text-muted-foreground'>
                /{totalCount}
              </span>
            </span>
          </div>
        </div>

        <div className='flex-1 min-w-0'>
          <dl className='flex flex-col gap-2.5'>
            {observationCount > 0 && (
              <div className='flex items-center justify-between gap-2 text-sm'>
                <dt className='flex items-center gap-2 text-muted-foreground'>
                  <Binoculars size={16} className='opacity-60' aria-hidden />
                  Observations
                </dt>
                <dd className='font-mono text-base font-semibold text-card-foreground'>
                  {observationCount}
                </dd>
              </div>
            )}
            {photoCount > 0 && (
              <div className='flex items-center justify-between gap-2 text-sm'>
                <dt className='flex items-center gap-2 text-muted-foreground'>
                  <Camera size={16} className='opacity-60' aria-hidden />
                  Photos taken
                </dt>
                <dd className='font-mono text-base font-semibold text-card-foreground'>{photoCount}</dd>
              </div>
            )}
            {savedLocationCount > 0 && (
              <div className='flex items-center justify-between gap-2 text-sm'>
                <dt className='flex items-center gap-2 text-muted-foreground'>
                  <MapPin size={16} className='opacity-60' aria-hidden />
                  Favorite locations
                </dt>
                <dd className='font-mono text-base font-semibold text-card-foreground'>
                  {savedLocationCount}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {(latestObservation || rarestFind) && (
        <div className='relative mt-5 pt-4 border-t border-border grid grid-cols-2 gap-4'>
          {latestObservation && (
            <div>
              <p className='font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2'>
                Latest find
              </p>
              <ObservationMiniCard observation={latestObservation} />
            </div>
          )}
          {rarestFind && (
            <div>
              <p className='font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2'>
                Rarest find
              </p>
              <ObservationMiniCard observation={rarestFind} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
