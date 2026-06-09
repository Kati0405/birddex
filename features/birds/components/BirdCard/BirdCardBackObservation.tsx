'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Music, Camera, ChevronLeft, ChevronRight, ImageOff, Pencil } from 'lucide-react';
import LocationMapPopover from '@/features/observations/components/LocationMapPopover/LocationMapPopover';
import type { Bird } from '@/entities/bird-domain';
import type { CollectionCardData, ObservationEntry } from '@/features/observations/observation-queries';
import type { SavedLocation } from '@/features/locations/location-queries';
import AddObservationModal from '@/features/observations/components/AddObservationModal/AddObservationModal';
import type { ObservationInitialData } from '@/features/observations/components/AddObservationModal/AddObservationModal';

interface Props {
  bird: Bird;
  frameColor: string;
  collectionData: CollectionCardData;
  savedLocations?: SavedLocation[];
}

const QUALITY_OPTS = [
  { value: 'bad',       symbol: '○', label: 'Brief glance' },
  { value: 'good',      symbol: '◑', label: 'Good view'    },
  { value: 'excellent', symbol: '●', label: 'Excellent'     },
] as const;

export default function BirdCardBackObservation({ bird, frameColor, collectionData, savedLocations = [] }: Props) {
  const { totalCount, seenCount, heardCount, photographedCount, observations: initial } = collectionData;
  const [observations, setObservations] = useState<ObservationEntry[]>(initial);
  const [idx, setIdx] = useState(0);
  const [editingObs, setEditingObs] = useState<ObservationEntry | null>(null);

  const obs = observations[idx];
  const quality = obs?.quality ? QUALITY_OPTS.find(q => q.value === obs.quality) : null;
  const evidence = [
    { Icon: Eye,    label: 'Seen',         active: obs?.seen },
    { Icon: Music,  label: 'Heard',        active: obs?.heard },
    { Icon: Camera, label: 'Photographed', active: obs?.photographed },
  ];

  function openEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditingObs(obs);
  }

  function handleSaved() {
    setEditingObs(null);
  }

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.min(observations.length - 1, i + 1)); };

  const initialData: ObservationInitialData | undefined = editingObs ? {
    observationId: editingObs.id,
    date: new Date(editingObs.observedAt),
    seen: editingObs.seen,
    heard: editingObs.heard,
    photographed: editingObs.photographed,
    quality: editingObs.quality,
    notes: editingObs.notes,
    photoUrl: editingObs.photoUrl,
    lat: editingObs.lat,
    lng: editingObs.lng,
    locationName: editingObs.locationName,
  } : undefined;

  return (
    <>
      <div
        className='[grid-area:1/1] h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl flex flex-col overflow-hidden bg-card'
        style={{ border: `2px solid ${frameColor}70`, boxShadow: `0 4px 20px ${frameColor}20` }}
      >
        <div className='h-1.5 sm:h-1 w-full shrink-0' style={{ background: frameColor }} />

        <div className='flex flex-col gap-3 sm:gap-2 p-5 sm:p-3.5 flex-1 min-h-0'>

          {/* Header */}
          <div className='flex items-center justify-between shrink-0'>
            <div>
              <p className='text-[11px] sm:text-[7px] uppercase tracking-[0.18em] font-mono text-muted-foreground mb-1 sm:mb-0.5'>My Sightings</p>
              <p className='text-xl sm:text-sm font-semibold text-card-foreground leading-tight'>{bird.name_eng}</p>
            </div>
            <div className='flex items-center gap-3 sm:gap-2.5 shrink-0'>
              {/* Big count */}
              <div title={`${totalCount} observation${totalCount !== 1 ? 's' : ''} total`} className='cursor-default leading-none'>
                <span className='text-[52px] sm:text-[36px] font-bold tabular-nums leading-none' style={{ color: frameColor }}>
                  {totalCount}
                </span>
              </div>
              {/* Evidence column */}
              <div className='flex flex-col gap-1 sm:gap-0.5'>
                {seenCount > 0 && (
                  <span title={`Seen ${seenCount} time${seenCount !== 1 ? 's' : ''}`} className='flex items-center gap-1.5 sm:gap-1 text-[12px] sm:text-[8px] font-mono text-muted-foreground cursor-default'>
                    <Eye className='h-4 w-4 sm:h-2.5 sm:w-2.5' /> {seenCount}
                  </span>
                )}
                {heardCount > 0 && (
                  <span title={`Heard ${heardCount} time${heardCount !== 1 ? 's' : ''}`} className='flex items-center gap-1.5 sm:gap-1 text-[12px] sm:text-[8px] font-mono text-muted-foreground cursor-default'>
                    <Music className='h-4 w-4 sm:h-2.5 sm:w-2.5' /> {heardCount}
                  </span>
                )}
                {photographedCount > 0 && (
                  <span title={`Photographed ${photographedCount} time${photographedCount !== 1 ? 's' : ''}`} className='flex items-center gap-1.5 sm:gap-1 text-[12px] sm:text-[8px] font-mono text-muted-foreground cursor-default'>
                    <Camera className='h-4 w-4 sm:h-2.5 sm:w-2.5' /> {photographedCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className='h-px w-full shrink-0' style={{ background: `${frameColor}18` }} />

          {obs && (
            <div className='flex flex-col gap-3 sm:gap-2 flex-1 min-h-0'>

              {/* Photo */}
              <div
                className='rounded-l-md overflow-hidden shrink-0 -mr-5 sm:-mr-3.5'
                style={{ height: 'clamp(160px, 38vh, 320px)', background: `${frameColor}08`, border: `1px solid ${frameColor}20`, borderRight: 'none' }}
              >
                {obs.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={obs.photoUrl} alt='Observation photo' className='w-full h-full object-cover' />
                ) : (
                  <div className='w-full h-full flex flex-col items-center justify-center gap-2 sm:gap-1'>
                    <ImageOff className='h-7 w-7 sm:h-4 sm:w-4' style={{ color: `${frameColor}35` }} />
                    <span className='text-[11px] sm:text-[8px] font-mono uppercase tracking-[0.1em]' style={{ color: `${frameColor}45` }}>No photo</span>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className='flex items-baseline justify-between'>
                <p className='text-lg sm:text-[13px] font-mono font-medium text-card-foreground leading-none'>
                  {format(new Date(obs.observedAt), 'd MMM yyyy')}
                </p>
                <p className='text-sm sm:text-[9px] font-mono text-muted-foreground'>
                  {format(new Date(obs.observedAt), 'HH:mm')}
                </p>
              </div>

              {/* Location */}
              {obs.lat !== null && obs.lng !== null && (
                <LocationMapPopover
                  lat={obs.lat}
                  lng={obs.lng}
                  locationName={obs.locationName}
                  frameColor={frameColor}
                />
              )}

              {/* Evidence + quality + edit */}
              <div className='flex items-center gap-1.5 sm:gap-1 shrink-0'>
                <div className='flex gap-1.5 sm:gap-1 flex-1 items-center'>
                  {evidence.map(({ Icon, label, active }) => (
                    <div
                      key={label}
                      className='flex items-center justify-center w-9 h-9 sm:w-6 sm:h-6 rounded-md'
                      style={active
                        ? { background: `${frameColor}20`, color: frameColor, border: `1px solid ${frameColor}50` }
                        : { background: 'transparent', color: 'var(--border)', border: '1px solid var(--border)' }
                      }
                      title={label}
                    >
                      <Icon className='h-4 w-4 sm:h-3 sm:w-3' />
                    </div>
                  ))}
                  {quality && (
                    <span className='text-sm sm:text-[9px] font-mono flex items-center gap-1 sm:gap-0.5 ml-1' style={{ color: `${frameColor}cc` }}>
                      <span className='text-base sm:text-[11px] leading-none'>{quality.symbol}</span>
                      {quality.label}
                    </span>
                  )}
                </div>
                <button
                  type='button'
                  onClick={openEdit}
                  title='Edit this observation'
                  className='flex items-center justify-center w-9 h-9 sm:w-6 sm:h-6 rounded-md transition-colors'
                  style={{ color: frameColor, border: `1px solid ${frameColor}40`, background: `${frameColor}10` }}
                >
                  <Pencil className='h-4 w-4 sm:h-3 sm:w-3' />
                </button>
              </div>

              {/* Field note */}
              {obs.notes ? (
                <div className='relative flex-1 min-h-0'>
                  <div
                    className='relative rounded-sm px-5 sm:px-4 py-3 sm:py-2 overflow-hidden h-full'
                    style={{
                      background: '#f7f1e6',
                      border: '1px solid #e5dac8',
                      backgroundImage:
                        'radial-gradient(rgba(120,90,50,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4), rgba(0,0,0,.03))',
                      backgroundSize: '6px 6px, 100% 100%',
                    }}
                  >
                    <div className='absolute left-2 top-3 sm:top-2 flex flex-col gap-2 sm:gap-1.5'>
                      <span className='h-2 w-2 sm:h-1.5 sm:w-1.5 rounded-full bg-white border border-[#d8cbb8] block' />
                      <span className='h-2 w-2 sm:h-1.5 sm:w-1.5 rounded-full bg-white border border-[#d8cbb8] block' />
                    </div>
                    <p
                      className='relative pl-6 sm:pl-5 pr-3 line-clamp-3 sm:line-clamp-2 leading-snug text-xl sm:text-[13px]'
                      style={{
                        fontFamily: 'var(--font-handwritten)',
                        color: '#3a2e1e',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {obs.notes}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className='rounded-sm px-5 sm:px-4 py-3 sm:py-2 flex-1 flex items-center justify-center min-h-0'
                  style={{ background: '#f7f1e6', border: '1px dashed #e5dac8' }}
                >
                  <p
                    className='text-sm sm:text-[10px] italic text-center'
                    style={{ fontFamily: 'var(--font-handwritten)', color: '#a89880' }}
                  >
                    No note written
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {observations.length > 1 && (
            <div className='flex items-center justify-between shrink-0'>
              <button
                type='button'
                onClick={prev}
                disabled={idx === 0}
                title='Previous observation'
                className='flex items-center justify-center w-10 h-10 sm:w-6 sm:h-6 rounded-md transition-all disabled:opacity-25'
                style={{ color: frameColor, border: `1px solid ${frameColor}30` }}
              >
                <ChevronLeft className='h-5 w-5 sm:h-3.5 sm:w-3.5' />
              </button>
              <span className='text-sm sm:text-[9px] font-mono text-muted-foreground tabular-nums'>
                {idx + 1} / {observations.length}
              </span>
              <button
                type='button'
                onClick={next}
                disabled={idx === observations.length - 1}
                title='Next observation'
                className='flex items-center justify-center w-10 h-10 sm:w-6 sm:h-6 rounded-md transition-all disabled:opacity-25'
                style={{ color: frameColor, border: `1px solid ${frameColor}30` }}
              >
                <ChevronRight className='h-5 w-5 sm:h-3.5 sm:w-3.5' />
              </button>
            </div>
          )}

        </div>
      </div>

      {editingObs && initialData && (
        <AddObservationModal
          birdId={bird.id}
          birdName={bird.name_eng}
          frameColor={frameColor}
          savedLocations={savedLocations}
          initialData={initialData}
          onClose={() => setEditingObs(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
