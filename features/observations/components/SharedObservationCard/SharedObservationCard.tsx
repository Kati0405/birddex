import Image from 'next/image';
import { format } from 'date-fns';
import { Eye, Music, Camera, MapPin, Calendar } from 'lucide-react';
import { RARITY_COLOR, type Rarity } from '@/entities/bird-domain';
import ObservationQualityStars from '@/features/observations/components/ObservationQualityStars/ObservationQualityStars';
import firstTimeBadge from '@/entities/bird-icons/ui/1st-time-badge.png';
import birdIcon from '@/entities/bird-icons/ui/bird.png';
import type { ObservationShareData } from '@/features/observations/public-share-queries';

interface Props {
  data: ObservationShareData;
}

export default function SharedObservationCard({ data }: Props) {
  const frameColor = RARITY_COLOR[data.rarity as Rarity] ?? RARITY_COLOR.Common;
  const hasEvidence = data.methods.seen || data.methods.heard || data.methods.photographed;

  return (
    <div
      className='rounded-xl overflow-hidden bg-card'
      style={{ border: `1px solid ${frameColor}40`, boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div className='relative w-full aspect-[4/3] bg-secondary'>
        {data.photo.url && (
          <Image
            src={data.photo.url}
            alt={data.birdName}
            fill
            sizes='(max-width: 640px) 100vw, 480px'
            className='object-cover'
          />
        )}

        {data.isFirstObservationOfSpecies && (
          <Image
            src={firstTimeBadge}
            alt='First encounter with this species'
            title='First encounter with this species'
            width={40}
            height={40}
            className='absolute top-3 right-3'
          />
        )}

        {data.photo.url && (
          <div className='absolute bottom-0 left-0 right-0 h-2/5 z-10 bg-linear-to-t from-black/70 to-transparent' />
        )}

        {data.photo.url && (
          <p className='absolute bottom-1 left-1 z-20 text-[9px] text-white/70 leading-none truncate max-w-[90%]'>
            {data.photo.source === 'observation' ? (
              `Photo by ${data.photo.credit ?? 'birds.in.ua'}`
            ) : data.photo.creditUrl ? (
              <>
                Photo:{' '}
                <a href={data.photo.creditUrl} target='_blank' rel='noopener noreferrer' className='hover:text-white'>
                  {data.photo.credit ?? 'Wikimedia Commons'}
                </a>
              </>
            ) : (
              `Photo: ${data.photo.credit ?? 'birds.in.ua'}`
            )}
          </p>
        )}
      </div>

      <div className='relative overflow-hidden'>
        <div className='absolute bottom-0 left-0 right-0 h-[30%]'>
          <Image
            src='/hero/shared-card-background.png'
            alt=''
            aria-hidden='true'
            fill
            className='object-cover object-bottom opacity-60'
          />
        </div>

        <div className='relative px-5 pt-4 flex items-center justify-between gap-3'>
          <span className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rarity-uncommon'>
            <Image
              src={birdIcon}
              alt=''
              aria-hidden='true'
              width={14}
              height={14}
              style={{ filter: 'brightness(0) saturate(100%) invert(35%) sepia(60%) saturate(1000%) hue-rotate(107deg) brightness(90%)' }}
            />
            Look who I found!
          </span>
          {data.quality != null && (
            <ObservationQualityStars rating={data.quality} size='sm' className='text-amber-500/70' />
          )}
        </div>

        <div className='px-5 pt-2 flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-xl font-bold text-card-foreground leading-tight truncate'>{data.birdName}</p>
            <p className='text-sm italic text-muted-foreground truncate'>{data.scientificName}</p>
          </div>
          <span
            className='flex items-center gap-1.5 rounded-full px-2.5 py-1 shrink-0'
            style={{ background: `${frameColor}18` }}
          >
            <span
              className='w-[9px] h-[9px] shrink-0'
              style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', background: frameColor }}
            />
            <span className='text-xs font-medium' style={{ color: frameColor }}>
              {data.rarity}
            </span>
          </span>
        </div>

        {hasEvidence && (
          <div className='px-5 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-card-foreground'>
            {data.methods.seen && (
              <span className='flex items-center gap-1.5'>
                <Eye className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
                Seen
              </span>
            )}
            {data.methods.heard && (
              <>
                {data.methods.seen && <span className='text-border'>|</span>}
                <span className='flex items-center gap-1.5'>
                  <Music className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
                  Heard
                </span>
              </>
            )}
            {data.methods.photographed && (
              <>
                {(data.methods.seen || data.methods.heard) && <span className='text-border'>|</span>}
                <span className='flex items-center gap-1.5'>
                  <Camera className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
                  Photographed
                </span>
              </>
            )}
          </div>
        )}

        <div
          className={`px-5 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-card-foreground ${hasEvidence ? 'pt-3 border-t border-border/60' : ''}`}
        >
          <span className='flex items-center gap-1.5'>
            <Calendar className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
            {format(new Date(data.observedAt), 'd MMM yyyy')}
          </span>
          {data.location.displayName && (
            <>
              <span className='text-border'>|</span>
              <span className='flex items-center gap-1.5'>
                <MapPin className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
                {data.location.displayName}
              </span>
            </>
          )}
        </div>

        <div className='px-5 mt-4 pb-16'>
          {data.author.displayName && (
            <p className='text-xs text-muted-foreground leading-tight'>
              Observed by <span className='font-medium text-card-foreground'>{data.author.displayName}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
