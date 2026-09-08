import Link from 'next/link';
import { format } from 'date-fns';
import { Bird, MapPin } from 'lucide-react';
import { RARITY_COLOR, type Rarity } from '@/entities/bird-domain';
import type { UserObservation } from '@/features/observations/observation-queries';

interface Props {
  observation: UserObservation;
}

export default function ObservationMiniCard({ observation }: Props) {
  const frameColor = RARITY_COLOR[observation.birdRarity as Rarity] ?? RARITY_COLOR.Common;
  const image = observation.photoThumbUrl ?? observation.birdImageUrl;

  return (
    <Link
      href={`/birds/${observation.birdId}?obs=${observation.id}&flipped=1`}
      className='flex items-center gap-2.5 rounded-lg p-2 -m-2 hover:bg-muted/30 transition-colors'
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=''
          className='h-9 w-9 rounded-md object-cover shrink-0'
          style={{ border: `1.5px solid ${frameColor}70` }}
        />
      ) : (
        <div
          className='h-9 w-9 rounded-md bg-muted/30 flex items-center justify-center shrink-0'
          style={{ border: `1.5px solid ${frameColor}70` }}
        >
          <Bird className='h-4 w-4 text-muted-foreground/40' />
        </div>
      )}
      <div className='min-w-0'>
        <p className='text-xs font-medium text-card-foreground truncate'>
          {observation.birdName}
        </p>
        <p className='text-[11px] text-muted-foreground'>
          {format(new Date(observation.observedAt), 'd MMM yyyy')}
        </p>
        {observation.locationName && (
          <p className='flex items-center gap-1 text-[11px] text-muted-foreground truncate'>
            <MapPin className='h-3 w-3 shrink-0 opacity-60' aria-hidden />
            <span className='truncate'>{observation.locationName}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
