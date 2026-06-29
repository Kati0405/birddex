'use client';

import { useState, useTransition } from 'react';
import ConfirmDeleteModal from '@/shared/ui/ConfirmDeleteModal/ConfirmDeleteModal';
import { CldImage } from 'next-cloudinary';
import { format } from 'date-fns';
import {
  Eye,
  Music,
  Camera,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Pencil,
  Trash2,
  MapPin,
} from 'lucide-react';
import LocationMapModal from '@/features/observations/components/LocationMapPopover/LocationMapPopover';
import {
  isCloudinaryUrl,
  cloudinaryPublicId,
} from '@/shared/lib/cloudinary-utils';
import type { Bird } from '@/entities/bird-domain';
import type {
  CollectionCardData,
  ObservationEntry,
} from '@/features/observations/observation-queries';
import type { SavedLocation } from '@/features/locations/location-queries';
import AddObservationModal from '@/features/observations/components/AddObservationModal/AddObservationModal';
import type { ObservationInitialData } from '@/features/observations/components/AddObservationModal/AddObservationModal';
import { deleteObservationAction } from '@/features/observations/actions/observation-mutations';

interface Props {
  bird: Bird;
  frameColor: string;
  collectionData?: CollectionCardData;
  savedLocations?: SavedLocation[];
}

const QUALITY_LABELS: Record<number, string> = {
  1: 'Brief glance',
  2: 'Partial view',
  3: 'Good view',
  4: 'Great view',
  5: 'Excellent encounter',
};

function QualityStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'xs' }) {
  const s = size === 'sm' ? 'w-3 h-3 sm:w-2 sm:h-2' : 'w-2.5 h-2.5 sm:w-1.5 sm:h-1.5';
  return (
    <div className='flex gap-px' title={QUALITY_LABELS[rating]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox='0 0 20 20' className={s} aria-hidden='true'>
          <path
            d='M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.24l-4.94 2.46.94-5.49-4-3.9 5.53-.8z'
            fill={i <= rating ? 'currentColor' : 'transparent'}
            stroke='currentColor'
            strokeWidth='1.2'
            strokeLinejoin='round'
            style={{ opacity: i <= rating ? 1 : 0.3 }}
          />
        </svg>
      ))}
    </div>
  );
}

/** Optimized observation photo — mirrors the Cloudinary pipeline used in BirdImage. */
function ObservationImage({ url, alt }: { url: string; alt: string }) {
  if (isCloudinaryUrl(url)) {
    return (
      <CldImage
        src={cloudinaryPublicId(url)}
        alt={alt}
        fill
        sizes='(max-width: 640px) 50vw, 320px'
        crop='fill'
        gravity='auto'
        className='object-cover object-center'
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className='absolute inset-0 w-full h-full object-cover'
    />
  );
}

function AddFirstObservation({
  bird,
  frameColor,
  savedLocations,
}: {
  bird: Bird;
  frameColor: string;
  savedLocations: SavedLocation[];
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className='flex flex-col flex-1 items-center justify-center gap-4 sm:gap-3 px-5 sm:px-4 pb-6 sm:pb-4'>
      <div
        className='w-16 h-16 sm:w-10 sm:h-10 rounded-full flex items-center justify-center'
        style={{
          background: `${frameColor}12`,
          border: `1.5px dashed ${frameColor}40`,
        }}
      >
        <Camera
          className='h-7 w-7 sm:h-4 sm:w-4'
          style={{ color: `${frameColor}60` }}
        />
      </div>
      <div className='text-center'>
        <p className='text-sm sm:text-[9px] font-semibold text-card-foreground leading-snug'>
          Not spotted yet
        </p>
        <p className='text-[12px] sm:text-[8px] text-muted-foreground mt-1 sm:mt-0.5 font-mono leading-snug'>
          Log your first encounter with {bird.name_eng}
        </p>
      </div>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        className='flex items-center gap-2 sm:gap-1.5 px-5 sm:px-3 py-2.5 sm:py-1.5 rounded-lg text-[12px] sm:text-[8px] font-mono uppercase tracking-[0.12em] transition-all active:scale-[0.97]'
        style={{
          background: frameColor,
          color: '#fff',
          boxShadow: `0 2px 10px ${frameColor}40`,
        }}
      >
        <Camera className='h-3.5 w-3.5 sm:h-2.5 sm:w-2.5' />
        Add first observation
      </button>

      {modalOpen && (
        <AddObservationModal
          birdId={bird.id}
          birdName={bird.name_eng}
          frameColor={frameColor}
          savedLocations={savedLocations}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

export default function BirdCardBackObservation({
  bird,
  frameColor,
  collectionData,
  savedLocations = [],
}: Props) {
  const [observations, setObservations] = useState<ObservationEntry[]>(
    collectionData?.observations ?? [],
  );
  const [idx, setIdx] = useState(0);
  const [editingObs, setEditingObs] = useState<ObservationEntry | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const totalCount = observations.length;
  const seenCount = observations.filter((o) => o.seen).length;
  const heardCount = observations.filter((o) => o.heard).length;
  const photographedCount = observations.filter((o) => o.photographed).length;

  // observations are newest-first; last item is oldest = first seen
  const firstSeenDate =
    observations.length > 0
      ? new Date(observations[observations.length - 1].observedAt)
      : null;
  const lastSeenDate =
    observations.length > 0 ? new Date(observations[0].observedAt) : null;

  const obs = observations[idx];
  const qualityRating = obs?.quality ?? null;
  const evidence = [
    { Icon: Eye, label: 'Seen', active: obs?.seen },
    { Icon: Music, label: 'Heard', active: obs?.heard },
    { Icon: Camera, label: 'Photographed', active: obs?.photographed },
  ];
  const hasLocation = obs?.lat !== null && obs?.lng !== null;

  function openEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditingObs(obs);
  }

  function handleSaved(updated?: ObservationInitialData) {
    if (updated) {
      setObservations((prev) =>
        prev.map((o) =>
          o.id === updated.observationId
            ? {
                ...o,
                observedAt: updated.date.toISOString(),
                seen: updated.seen,
                heard: updated.heard,
                photographed: updated.photographed,
                quality: updated.quality,
                notes: updated.notes,
                photoUrl: updated.photoUrl,
                lat: updated.lat,
                lng: updated.lng,
                locationName: updated.locationName,
              }
            : o,
        ),
      );
    }
    setEditingObs(null);
  }

  function openDeleteConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmDelete(true);
    setDeleteError(null);
  }

  function handleDeleteConfirmed() {
    startDeleteTransition(async () => {
      const result = await deleteObservationAction({ id: obs.id });
      if ('error' in result) {
        setDeleteError(result.error);
        setConfirmDelete(false);
      } else {
        const next = observations.filter((o) => o.id !== obs.id);
        setObservations(next);
        setIdx(Math.min(idx, Math.max(0, next.length - 1)));
        setConfirmDelete(false);
      }
    });
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => Math.max(0, i - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => Math.min(observations.length - 1, i + 1));
  };

  const initialData: ObservationInitialData | undefined = editingObs
    ? {
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
      }
    : undefined;

  if (!collectionData) {
    return (
      <AddFirstObservation
        bird={bird}
        frameColor={frameColor}
        savedLocations={savedLocations}
      />
    );
  }

  return (
    <>
      <div className='flex flex-col flex-1 min-h-0 overflow-hidden'>
        {/* ════════ SUMMARY HEADER ════════ */}
        <div
          className='px-5 sm:px-3.5 pt-2 sm:pt-1.5 pb-3 sm:pb-2 shrink-0 flex flex-col gap-2 sm:gap-1.5'
          style={{
            background: `linear-gradient(180deg, ${frameColor}10, transparent)`,
          }}
        >
          {/* Count + evidence row */}
          <div className='flex items-center gap-3 sm:gap-2'>
            <span
              className='text-[42px] sm:text-[28px] font-bold tabular-nums leading-none'
              style={{ color: frameColor }}
            >
              {totalCount}
            </span>
            <div className='flex flex-col gap-0.5 sm:gap-px'>
              <span
                className='text-[9px] sm:text-[6px] uppercase tracking-[0.2em] font-mono leading-none'
                style={{ color: `${frameColor}88` }}
              >
                {totalCount === 1 ? 'encounter' : 'encounters'}
              </span>
              <div className='flex items-center gap-2 sm:gap-1.5 mt-0.5'>
                {seenCount > 0 && (
                  <span className='flex items-center gap-1 text-[11px] sm:text-[7px] font-mono text-muted-foreground tabular-nums'>
                    <Eye className='h-3 w-3 sm:h-2 sm:w-2 shrink-0' />
                    {seenCount}
                  </span>
                )}
                {heardCount > 0 && (
                  <span className='flex items-center gap-1 text-[11px] sm:text-[7px] font-mono text-muted-foreground tabular-nums'>
                    <Music className='h-3 w-3 sm:h-2 sm:w-2 shrink-0' />
                    {heardCount}
                  </span>
                )}
                {photographedCount > 0 && (
                  <span className='flex items-center gap-1 text-[11px] sm:text-[7px] font-mono text-muted-foreground tabular-nums'>
                    <Camera className='h-3 w-3 sm:h-2 sm:w-2 shrink-0' />
                    {photographedCount}
                  </span>
                )}
              </div>
            </div>

            {/* Date range pushed to the right */}
            {firstSeenDate && lastSeenDate && (
              <div className='ml-auto text-right shrink-0 flex flex-col gap-1 sm:gap-0.5'>
                <p className='text-[11px] sm:text-[7px] font-mono leading-tight whitespace-nowrap'>
                  <span
                    className='uppercase tracking-[0.16em] text-[8px] sm:text-[5.5px]'
                    style={{ color: frameColor }}
                  >
                    First{' '}
                  </span>
                  <span className='text-card-foreground'>
                    {format(firstSeenDate, 'd MMM yyyy')}
                  </span>
                </p>
                {firstSeenDate.toDateString() !==
                  lastSeenDate.toDateString() && (
                  <p className='text-[11px] sm:text-[7px] font-mono leading-tight whitespace-nowrap'>
                    <span
                      className='uppercase tracking-[0.16em] text-[8px] sm:text-[5.5px]'
                      style={{ color: frameColor }}
                    >
                      Last{' '}
                    </span>
                    <span className='text-card-foreground'>
                      {format(lastSeenDate, 'd MMM yyyy')}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ════════ ENCOUNTER ════════ */}
        {obs && (
          <div className='flex flex-col flex-1 min-h-0 px-5 sm:px-3 pb-4 sm:pb-2.5'>
            {deleteError && (
              <p className='text-[10px] font-mono text-destructive shrink-0 mb-1.5'>
                ⚠ {deleteError}
              </p>
            )}

            {/* Pager */}
            <div className='flex items-center justify-between shrink-0 mb-2 sm:mb-1.5'>
              <button
                type='button'
                onClick={prev}
                disabled={observations.length <= 1 || idx === 0}
                title='Previous observation'
                className='flex items-center justify-center w-8 h-8 sm:w-5 sm:h-5 rounded-full transition-opacity disabled:opacity-20 hover:bg-[var(--hover)]'
                style={
                  {
                    color: frameColor,
                    '--hover': `${frameColor}14`,
                  } as React.CSSProperties
                }
              >
                <ChevronLeft className='h-5 w-5 sm:h-3 sm:w-3' />
              </button>
              <span
                className='text-[11px] sm:text-[6.5px] uppercase tracking-[0.2em] font-mono tabular-nums'
                style={{ color: `${frameColor}aa` }}
              >
                Encounter {idx + 1} / {observations.length}
              </span>
              <button
                type='button'
                onClick={next}
                disabled={
                  observations.length <= 1 || idx === observations.length - 1
                }
                title='Next observation'
                className='flex items-center justify-center w-8 h-8 sm:w-5 sm:h-5 rounded-full transition-opacity disabled:opacity-20 hover:bg-[var(--hover)]'
                style={
                  {
                    color: frameColor,
                    '--hover': `${frameColor}14`,
                  } as React.CSSProperties
                }
              >
                <ChevronRight className='h-5 w-5 sm:h-3 sm:w-3' />
              </button>
            </div>

            {/* Hero photo with overlaid date + quality */}
            <div
              className='relative rounded-lg overflow-hidden shrink-0 bg-secondary h-[30vh] sm:h-[24vh]'
              style={{ boxShadow: `inset 0 0 0 1px ${frameColor}1f` }}
            >
              {obs.photoUrl ? (
                <ObservationImage url={obs.photoUrl} alt='Observation photo' />
              ) : (
                <div
                  className='absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-1'
                  style={{ background: `${frameColor}0a` }}
                >
                  <ImageOff
                    className='h-8 w-8 sm:h-4 sm:w-4'
                    style={{ color: `${frameColor}40` }}
                  />
                  <span
                    className='text-[11px] sm:text-[6.5px] font-mono uppercase tracking-[0.12em]'
                    style={{ color: `${frameColor}55` }}
                  >
                    No photo
                  </span>
                </div>
              )}

              {/* bottom scrim */}
              <div className='absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none' />

              {/* date + time, bottom-left */}
              <div className='absolute bottom-0 left-0 p-2.5 sm:p-2'>
                <p className='text-white leading-none text-base sm:text-[11px] font-mono'>
                  {format(new Date(obs.observedAt), 'd MMM yyyy')}
                </p>
                <p className='text-white/70 font-mono text-[11px] sm:text-[7px] mt-1 sm:mt-0.5 tabular-nums'>
                  {format(new Date(obs.observedAt), 'HH:mm')}
                </p>
              </div>

              {/* quality stars, top-right */}
              {qualityRating && (
                <div
                  className='absolute top-2 right-2 sm:top-1.5 sm:right-1.5 flex items-center gap-1.5 sm:gap-1 rounded-full px-2.5 sm:px-1.5 py-1 sm:py-0.5 backdrop-blur-sm text-white'
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.25)',
                  }}
                  title={QUALITY_LABELS[qualityRating]}
                >
                  <QualityStars rating={qualityRating} size='xs' />
                </div>
              )}

            </div>

            {/* Location + evidence strip */}
            <div className='flex items-center justify-between gap-2 shrink-0 mt-2 sm:mt-1.5 min-w-0'>
              {hasLocation && obs.lat !== null && obs.lng !== null ? (
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    setMapOpen(true);
                  }}
                  title='Show on map'
                  className='flex items-center gap-1.5 sm:gap-1 min-w-0 group'
                >
                  <MapPin
                    className='h-4 w-4 sm:h-2.5 sm:w-2.5 shrink-0'
                    style={{ color: `${frameColor}99` }}
                  />
                  <span className='min-w-0 text-left'>
                    {obs.locationName ? (
                      <span className='block text-[12px] sm:text-[8px] font-mono text-card-foreground leading-tight truncate group-hover:underline'>
                        {obs.locationName}
                      </span>
                    ) : (
                      <span
                        className='block text-[11px] sm:text-[7px] font-mono leading-tight tabular-nums group-hover:underline'
                        style={{ color: `${frameColor}99` }}
                      >
                        {obs.lat.toFixed(3)}, {obs.lng.toFixed(3)}
                      </span>
                    )}
                  </span>
                </button>
              ) : (
                <span className='text-[11px] sm:text-[7px] font-mono text-muted-foreground/50 italic'>
                  No location
                </span>
              )}

              <div className='flex items-center gap-1.5 sm:gap-1 shrink-0'>
                {evidence
                  .filter(({ active }) => active)
                  .map(({ Icon, label }) => (
                    <div
                      key={label}
                      aria-label={label}
                      role='img'
                      className='flex items-center justify-center w-8 h-8 sm:w-5 sm:h-5 rounded-full'
                      style={{
                        background: `${frameColor}16`,
                        color: `${frameColor}cc`,
                      }}
                    >
                      <Icon
                        className='h-4 w-4 sm:h-2.5 sm:w-2.5'
                        aria-hidden='true'
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* Handwritten note */}
            <div className='flex-1 min-h-0 mt-2 sm:mt-1.5'>
              {obs.notes ? (
                <div
                  className='relative h-full rounded-lg px-4 sm:px-3 py-2.5 sm:py-2 overflow-auto'
                  style={{
                    background: '#f7f1e6',
                    border: '1px solid #e8ddc9',
                    backgroundImage:
                      'radial-gradient(rgba(120,90,50,0.06) 1px, transparent 1px)',
                    backgroundSize: '7px 7px',
                  }}
                >
                  <p
                    className='leading-snug text-xl sm:text-[13px]'
                    style={{
                      fontFamily: 'var(--font-handwritten)',
                      color: '#3a2e1e',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {obs.notes}
                  </p>
                </div>
              ) : (
                <div
                  className='h-full rounded-lg flex items-center justify-center'
                  style={{
                    background: '#f7f1e60d',
                    border: '1px dashed #e5dac855',
                  }}
                >
                  <p
                    className='text-lg sm:text-[10px] italic'
                    style={{
                      fontFamily: 'var(--font-handwritten)',
                      color: '#a89880',
                    }}
                  >
                    No note written
                  </p>
                </div>
              )}
            </div>

            {/* Edit / Delete */}
            <div className='flex items-center justify-end gap-2 sm:gap-1.5 shrink-0 mt-2 sm:mt-1.5'>
              <button
                type='button'
                onClick={openEdit}
                title='Edit this observation'
                className='flex items-center justify-center w-9 h-9 sm:w-5 sm:h-5 rounded-md transition-colors text-muted-foreground/60 hover:text-[var(--edit-color)] hover:bg-[var(--edit-bg)]'
                style={{
                  '--edit-color': `${frameColor}dd`,
                  '--edit-bg': `${frameColor}12`,
                } as React.CSSProperties}
              >
                <Pencil className='h-4 w-4 sm:h-2.5 sm:w-2.5' />
              </button>
              <button
                type='button'
                onClick={openDeleteConfirm}
                title='Delete this observation'
                className='flex items-center justify-center w-9 h-9 sm:w-5 sm:h-5 rounded-md transition-colors text-muted-foreground/60 hover:text-[var(--del-color)] hover:bg-[var(--del-bg)]'
                style={{
                  '--del-color': `${frameColor}dd`,
                  '--del-bg': `${frameColor}12`,
                } as React.CSSProperties}
              >
                <Trash2 className='h-4 w-4 sm:h-2.5 sm:w-2.5' />
              </button>
            </div>
          </div>
        )}
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

      {obs && obs.lat !== null && obs.lng !== null && (
        <LocationMapModal
          lat={obs.lat}
          lng={obs.lng}
          locationName={obs.locationName}
          frameColor={frameColor}
          open={mapOpen}
          onClose={() => setMapOpen(false)}
        />
      )}

      {confirmDelete && obs && (
        <ConfirmDeleteModal
          title='Delete observation'
          error={deleteError}
          pending={deletePending}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(false)}
        >
          Delete this observation from{' '}
          <span className='font-semibold'>
            {format(new Date(obs.observedAt), 'd MMM yyyy')}
          </span>
          ? This cannot be undone.
        </ConfirmDeleteModal>
      )}
    </>
  );
}
