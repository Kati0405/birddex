import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { Eye, Music, Camera, MapPin, Calendar } from 'lucide-react';
import { getPublicObservationShareData } from '@/features/observations/public-share-queries';
import { RARITY_COLOR, type Rarity } from '@/entities/bird-domain';
import ObservationQualityStars from '@/features/observations/components/ObservationQualityStars/ObservationQualityStars';
import firstTimeBadge from '@/entities/bird-icons/ui/1st-time-badge.png';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}): Promise<Metadata> {
  const { shareSlug } = await params;
  const data = await getPublicObservationShareData(shareSlug);
  if (!data) return { title: 'Observation not found — birds.in.ua' };

  return {
    title: `${data.birdName} — birds.in.ua`,
    description: `Spotted ${format(new Date(data.observedAt), 'd MMM yyyy')}${data.location.displayName ? ` in ${data.location.displayName}` : ''}.`,
    robots: { index: false, follow: false },
  };
}

export default async function SharedObservationPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const data = await getPublicObservationShareData(shareSlug);
  if (!data) notFound();

  const frameColor = RARITY_COLOR[data.rarity as Rarity] ?? RARITY_COLOR.Common;

  return (
    <main className='min-h-screen bg-background px-4 py-12 sm:px-8'>
      <div className='mx-auto max-w-sm'>
        <div
          className='rounded-xl overflow-hidden bg-card'
          style={{ border: `2px solid ${frameColor}70`, boxShadow: `0 8px 40px ${frameColor}30, 0 2px 12px rgba(0,0,0,0.25)` }}
        >
          <div className='h-1.5 w-full' style={{ background: frameColor }} />

          <div className='relative w-full aspect-square bg-secondary'>
            {data.photo.url && (
              <Image
                src={data.photo.url}
                alt={data.birdName}
                fill
                sizes='(max-width: 640px) 100vw, 384px'
                className='object-cover'
              />
            )}

            {data.isFirstObservationOfSpecies && (
              <Image
                src={firstTimeBadge}
                alt='First encounter with this species'
                title='First encounter with this species'
                width={32}
                height={32}
                className='absolute top-3 right-3'
              />
            )}

            {data.photo.credit && (
              <p className='absolute bottom-1 left-1 text-[9px] text-white/70 leading-none truncate max-w-[90%]'>
                {data.photo.credit}
              </p>
            )}
          </div>

          <div className='px-5 py-4 flex flex-col gap-2'>
            <div>
              <p className='text-sm font-semibold text-card-foreground leading-tight'>{data.birdName}</p>
              <p className='text-xs italic text-muted-foreground'>{data.scientificName}</p>
            </div>

            <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground'>
              <span className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' aria-hidden='true' />
                {format(new Date(data.observedAt), 'd MMM yyyy')}
              </span>
              {data.location.displayName && (
                <span className='flex items-center gap-1'>
                  <MapPin className='h-3 w-3' aria-hidden='true' />
                  {data.location.displayName}
                </span>
              )}
            </div>

            <div className='flex items-center gap-3'>
              {(data.methods.seen || data.methods.heard || data.methods.photographed) && (
                <span className='flex items-center gap-1.5 text-muted-foreground/70'>
                  {data.methods.seen && <Eye className='h-3.5 w-3.5' aria-label='Seen' />}
                  {data.methods.heard && <Music className='h-3.5 w-3.5' aria-label='Heard' />}
                  {data.methods.photographed && <Camera className='h-3.5 w-3.5' aria-label='Photographed' />}
                </span>
              )}
              {data.quality != null && (
                <ObservationQualityStars rating={data.quality} size='sm' className='text-amber-500/70' />
              )}
            </div>

            {data.author.displayName && (
              <p className='text-[10px] text-muted-foreground/60'>
                Logged by {data.author.displayName}
              </p>
            )}
          </div>

          <div className='px-5 py-2 border-t border-border/50 flex items-center justify-center'>
            <p className='text-[9px] uppercase tracking-[0.18em] font-mono text-muted-foreground/50'>
              birds.in.ua
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
