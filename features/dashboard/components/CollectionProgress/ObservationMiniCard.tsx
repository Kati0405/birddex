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
        <img src={image} alt='' className='h-12 w-12 rounded-md object-cover shrink-0' />
      ) : (
        <div className='h-12 w-12 rounded-md bg-muted/30 flex items-center justify-center shrink-0'>
          <Bird className='h-5 w-5 text-muted-foreground/40' />
        </div>
      )}
      <div className='min-w-0'>
        <p className='flex items-center gap-1.5 text-xs font-medium text-card-foreground min-w-0'>
          <span
            className='w-[7px] h-[7px] shrink-0'
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              background: frameColor,
            }}
            title={`Rarity: ${observation.birdRarity}`}
          />
          <span className='truncate'>{observation.birdName}</span>
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
