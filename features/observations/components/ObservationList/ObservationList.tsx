'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import {
  Eye,
  Music,
  Camera,
  Bird,
  MapPin,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserObservation } from '@/features/observations/observation-queries';

interface Props {
  observations: UserObservation[];
}

export default function ObservationList({ observations }: Props) {
  if (observations.length === 0) {
    return (
      <div className='rounded-xl border border-dashed border-border bg-card/50 px-6 py-8 text-center'>
        <Bird className='h-8 w-8 text-muted-foreground/20 mx-auto mb-2' />
        <p className='text-sm font-medium text-card-foreground'>No observations yet</p>
        <p className='text-xs text-muted-foreground mt-1'>
          Find a bird in the catalog and log your first sighting.
        </p>
        <Link href='/birds' className='inline-block mt-3'>
          <Button size='sm' variant='outline'>
            <Plus className='h-3.5 w-3.5' />
            Browse birds
          </Button>
        </Link>
      </div>
    );
  }

  const grouped = groupByDate(observations);

  return (
    <div className='flex flex-col gap-5'>
      {grouped.map(({ label, observations: obs }) => (
        <div key={label}>
          <h2 className='text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2'>
            {label}
          </h2>
          <div className='rounded-xl border border-border bg-card divide-y divide-border'>
            {obs.map((o) => (
              <Link
                key={o.id}
                href={`/birds/${o.birdId}`}
                className='flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group first:rounded-t-xl last:rounded-b-xl'
              >
                {(o.photoUrl || o.birdImageUrl) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={(o.photoUrl ?? o.birdImageUrl)!}
                    alt={o.birdName}
                    className='h-9 w-9 rounded-lg object-cover shrink-0'
                  />
                ) : (
                  <div className='h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0'>
                    <Bird className='h-4 w-4 text-muted-foreground/40' />
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors'>
                    {o.birdName}
                  </p>
                  <div className='flex items-center gap-2 mt-0.5'>
                    <span className='text-[11px] text-muted-foreground'>
                      {format(new Date(o.observedAt), 'd MMM yyyy')}
                    </span>
                    <span className='flex items-center gap-1 text-muted-foreground/50'>
                      {o.seen && <Eye className='h-3 w-3' />}
                      {o.heard && <Music className='h-3 w-3' />}
                      {o.photographed && <Camera className='h-3 w-3' />}
                    </span>
                    {o.quality != null && (() => {
                      const q = o.quality;
                      return (
                        <span className='flex gap-px text-amber-500/70' title={`${q}/5`}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <svg key={i} viewBox='0 0 20 20' className='w-2.5 h-2.5' aria-hidden='true'>
                              <path
                                d='M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.24l-4.94 2.46.94-5.49-4-3.9 5.53-.8z'
                                fill={i <= q ? 'currentColor' : 'transparent'}
                                stroke='currentColor'
                                strokeWidth='1.2'
                                strokeLinejoin='round'
                                style={{ opacity: i <= q ? 1 : 0.25 }}
                              />
                            </svg>
                          ))}
                        </span>
                      );
                    })()}
                    {o.locationName && (
                      <span className='flex items-center gap-0.5 text-[11px] text-muted-foreground/50 truncate'>
                        <MapPin className='h-3 w-3 shrink-0' />
                        <span className='truncate'>{o.locationName}</span>
                      </span>
                    )}
                  </div>
                  {o.notes && (
                    <p className='text-[11px] text-muted-foreground/50 truncate mt-0.5'>
                      {o.notes}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByDate(observations: UserObservation[]) {
  const groups: { label: string; observations: UserObservation[] }[] = [];
  const map = new Map<string, UserObservation[]>();

  for (const obs of observations) {
    const label = format(new Date(obs.observedAt), 'MMMM yyyy');
    const existing = map.get(label);
    if (existing) {
      existing.push(obs);
    } else {
      const arr = [obs];
      map.set(label, arr);
      groups.push({ label, observations: arr });
    }
  }

  return groups;
}
