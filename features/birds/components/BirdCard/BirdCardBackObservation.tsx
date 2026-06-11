'use client';

import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
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
import { isCloudinaryUrl, cloudinaryPublicId } from '@/shared/lib/cloudinary-utils';
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
  collectionData: CollectionCardData;
  savedLocations?: SavedLocation[];
}

const QUALITY_OPTS = [
  { value: 'bad', symbol: '○', label: 'Brief glance' },
  { value: 'good', symbol: '◑', label: 'Good view' },
  { value: 'excellent', symbol: '●', label: 'Excellent' },
] as const;

/** Optimized observation photo — mirrors the Cloudinary pipeline used in BirdImage. */
function ObservationImage({ url, alt }: { url: string; alt: string }) {
  if (isCloudinaryUrl(url)) {
    return (
      <CldImage
        src={cloudinaryPublicId(url)}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, 320px"
        crop="fill"
        gravity="auto"
        className="object-cover object-center"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
  );
}

export default function BirdCardBackObservation({
  bird,
  frameColor,
  collectionData,
  savedLocations = [],
}: Props) {
  const { observations: initial } = collectionData;
  const [observations, setObservations] = useState<ObservationEntry[]>(initial);
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
  const quality = obs?.quality
    ? QUALITY_OPTS.find((q) => q.value === obs.quality)
    : null;
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

  function handleDeleteConfirmed(e: React.MouseEvent) {
    e.stopPropagation();
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

  return (
    <>
      <div
        className='[grid-area:1/1] absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl flex flex-col overflow-hidden bg-card'
        style={{
          border: `2px solid ${frameColor}70`,
          boxShadow: `0 4px 20px ${frameColor}20`,
        }}
      >
        <div
          className='h-1.5 sm:h-1 w-full shrink-0'
          style={{ background: frameColor }}
        />

        {/* ════════ SUMMARY HEADER ════════ */}
        <div
          className='relative flex items-center justify-between gap-3 px-5 sm:px-3.5 pt-4 sm:pt-2.5 pb-3 sm:pb-2.5 shrink-0'
          style={{
            background: `linear-gradient(180deg, ${frameColor}12, transparent)`,
          }}
        >
          <div className='min-w-0 flex-1'>
            <p
              className='text-[11px] sm:text-[6.5px] uppercase tracking-[0.2em] font-mono'
              style={{ color: `${frameColor}aa` }}
            >
              My observations
            </p>
            <h3 className='text-xl sm:text-base font-semibold leading-tight truncate text-card-foreground mt-0.5'>
              {bird.name_eng}
            </h3>
            {firstSeenDate && lastSeenDate && (
              <p className='text-[11px] sm:text-[7.5px] font-mono text-muted-foreground mt-0.5 truncate'>
                {format(firstSeenDate, 'd MMM yyyy')}
                <span style={{ color: `${frameColor}99` }} className='px-1'>→</span>
                {format(lastSeenDate, 'd MMM yyyy')}
              </p>
            )}
          </div>

          {/* Big total + evidence tallies */}
          <div className='flex items-center gap-3 sm:gap-2 shrink-0'>
            <div className='flex flex-col items-end gap-1 sm:gap-0.5'>
              {seenCount > 0 && (
                <span className='flex items-center gap-1.5 sm:gap-1 text-[12px] sm:text-[7.5px] font-mono text-muted-foreground tabular-nums'>
                  {seenCount}<Eye className='h-4 w-4 sm:h-2.5 sm:w-2.5' />
                </span>
              )}
              {heardCount > 0 && (
                <span className='flex items-center gap-1.5 sm:gap-1 text-[12px] sm:text-[7.5px] font-mono text-muted-foreground tabular-nums'>
                  {heardCount}<Music className='h-4 w-4 sm:h-2.5 sm:w-2.5' />
                </span>
              )}
              {photographedCount > 0 && (
                <span className='flex items-center gap-1.5 sm:gap-1 text-[12px] sm:text-[7.5px] font-mono text-muted-foreground tabular-nums'>
                  {photographedCount}<Camera className='h-4 w-4 sm:h-2.5 sm:w-2.5' />
                </span>
              )}
            </div>
            <div className='flex flex-col items-center'>
              <span
                className='text-[52px] sm:text-[36px] font-bold tabular-nums leading-[0.85]'
                style={{ color: frameColor }}
              >
                {totalCount}
              </span>
              <span
                className='text-[9px] sm:text-[5.5px] uppercase tracking-[0.2em] font-mono mt-0.5'
                style={{ color: `${frameColor}99` }}
              >
                {totalCount === 1 ? 'time' : 'times'}
              </span>
            </div>
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
                style={{ color: frameColor, '--hover': `${frameColor}14` } as React.CSSProperties}
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
                disabled={observations.length <= 1 || idx === observations.length - 1}
                title='Next observation'
                className='flex items-center justify-center w-8 h-8 sm:w-5 sm:h-5 rounded-full transition-opacity disabled:opacity-20 hover:bg-[var(--hover)]'
                style={{ color: frameColor, '--hover': `${frameColor}14` } as React.CSSProperties}
              >
                <ChevronRight className='h-5 w-5 sm:h-3 sm:w-3' />
              </button>
            </div>

            {/* Hero photo with overlaid date + quality */}
            <div
              className='relative rounded-lg overflow-hidden shrink-0 bg-secondary h-[40vh] sm:h-[28vh]'
              style={{ boxShadow: `inset 0 0 0 1px ${frameColor}1f` }}
            >
              {obs.photoUrl ? (
                <ObservationImage url={obs.photoUrl} alt='Observation photo' />
              ) : (
                <div
                  className='absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-1'
                  style={{ background: `${frameColor}0a` }}
                >
                  <ImageOff className='h-8 w-8 sm:h-4 sm:w-4' style={{ color: `${frameColor}40` }} />
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

              {/* quality pill, top-right */}
              {quality && (
                <div
                  className='absolute top-2 right-2 sm:top-1.5 sm:right-1.5 flex items-center gap-1 rounded-full px-2.5 sm:px-1.5 py-1 sm:py-0.5 backdrop-blur-sm'
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.25)' }}
                  title={`Quality: ${quality.label}`}
                >
                  <span className='text-white text-sm sm:text-[9px] leading-none'>{quality.symbol}</span>
                  <span className='text-white/90 font-mono text-[11px] sm:text-[6.5px] uppercase tracking-[0.1em]'>{quality.label}</span>
                </div>
              )}

              {/* map button, top-left */}
              {hasLocation && (
                <button
                  type='button'
                  onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}
                  title='Show on map'
                  className='absolute top-2 left-2 sm:top-1.5 sm:left-1.5 flex items-center justify-center w-8 h-8 sm:w-5 sm:h-5 rounded-full backdrop-blur-sm transition-transform active:scale-90'
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
                >
                  <MapPin className='h-4 w-4 sm:h-2.5 sm:w-2.5' />
                </button>
              )}
            </div>

            {/* Location + evidence strip */}
            <div className='flex items-center justify-between gap-2 shrink-0 mt-2 sm:mt-1.5 min-w-0'>
              {hasLocation && obs.lat !== null && obs.lng !== null ? (
                <button
                  type='button'
                  onClick={(e) => { e.stopPropagation(); setMapOpen(true); }}
                  title='Show on map'
                  className='flex items-center gap-1.5 sm:gap-1 min-w-0 group'
                >
                  <MapPin className='h-4 w-4 sm:h-2.5 sm:w-2.5 shrink-0' style={{ color: `${frameColor}99` }} />
                  <span className='min-w-0 text-left'>
                    {obs.locationName ? (
                      <span className='block text-[12px] sm:text-[8px] font-mono text-card-foreground leading-tight truncate group-hover:underline'>
                        {obs.locationName}
                      </span>
                    ) : (
                      <span className='block text-[11px] sm:text-[7px] font-mono leading-tight tabular-nums group-hover:underline' style={{ color: `${frameColor}99` }}>
                        {obs.lat.toFixed(3)}, {obs.lng.toFixed(3)}
                      </span>
                    )}
                  </span>
                </button>
              ) : (
                <span className='text-[11px] sm:text-[7px] font-mono text-muted-foreground/50 italic'>No location</span>
              )}

              <div className='flex items-center gap-1.5 sm:gap-1 shrink-0'>
                {evidence.filter(({ active }) => active).map(({ Icon, label }) => (
                  <div
                    key={label}
                    aria-label={label}
                    role='img'
                    className='flex items-center justify-center w-8 h-8 sm:w-5 sm:h-5 rounded-full'
                    style={{ background: `${frameColor}16`, color: `${frameColor}cc` }}
                  >
                    <Icon className='h-4 w-4 sm:h-2.5 sm:w-2.5' aria-hidden='true' />
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
                    backgroundImage: 'radial-gradient(rgba(120,90,50,0.06) 1px, transparent 1px)',
                    backgroundSize: '7px 7px',
                  }}
                >
                  <p
                    className='leading-snug text-xl sm:text-[13px]'
                    style={{ fontFamily: 'var(--font-handwritten)', color: '#3a2e1e', letterSpacing: '0.01em' }}
                  >
                    {obs.notes}
                  </p>
                </div>
              ) : (
                <div
                  className='h-full rounded-lg flex items-center justify-center'
                  style={{ background: '#f7f1e60d', border: '1px dashed #e5dac855' }}
                >
                  <p
                    className='text-lg sm:text-[10px] italic'
                    style={{ fontFamily: 'var(--font-handwritten)', color: '#a89880' }}
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
                className='flex items-center gap-1.5 sm:gap-1 px-3 sm:px-2 py-2 sm:py-1 rounded-md text-[12px] sm:text-[7px] font-mono uppercase tracking-[0.12em] transition-colors'
                style={{ color: `${frameColor}dd`, background: `${frameColor}12` }}
              >
                <Pencil className='h-3.5 w-3.5 sm:h-2 sm:w-2' />
                Edit
              </button>
              <button
                type='button'
                onClick={openDeleteConfirm}
                title='Delete this observation'
                className='flex items-center justify-center w-9 h-9 sm:w-5 sm:h-5 rounded-md transition-colors text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10'
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

      {confirmDelete &&
        obs &&
        createPortal(
          <div
            className='fixed inset-0 z-[110] flex items-center justify-center p-4'
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={(e) => {
              e.stopPropagation();
              if (!deletePending) setConfirmDelete(false);
            }}
          >
            <div
              className='w-full max-w-xs rounded-xl overflow-hidden bg-card flex flex-col'
              style={{
                border: '2px solid #fca5a5',
                boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className='h-1 w-full shrink-0 bg-destructive' />
              <div className='px-5 py-4 flex flex-col gap-3'>
                <p className='text-[7px] uppercase tracking-[0.18em] font-mono text-muted-foreground'>
                  Delete observation
                </p>
                <p className='text-sm text-card-foreground'>
                  Delete this observation from{' '}
                  <span className='font-semibold'>
                    {format(new Date(obs.observedAt), 'd MMM yyyy')}
                  </span>
                  ? This cannot be undone.
                </p>
                {deleteError && (
                  <p className='text-[10px] font-mono text-destructive'>
                    ⚠ {deleteError}
                  </p>
                )}
                <div className='flex gap-2 justify-end'>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(false);
                    }}
                    disabled={deletePending}
                    className='px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.1em] border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors disabled:opacity-50'
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    onClick={handleDeleteConfirmed}
                    disabled={deletePending}
                    className='px-4 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.1em] transition-all active:scale-[0.97] disabled:opacity-60'
                    style={{ background: '#dc2626', color: '#ffffff' }}
                  >
                    {deletePending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
