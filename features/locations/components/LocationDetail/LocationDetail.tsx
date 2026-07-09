'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Eye,
  Music,
  Camera,
  Bird,
  Calendar,
  Star,
  Trash2,
  Images,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDeleteModal from '@/shared/ui/ConfirmDeleteModal/ConfirmDeleteModal';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import { biomeImage } from '@/entities/bird-domain';
import {
  deleteLocationAction,
  updateLocationPhotoAction,
} from '@/features/locations/actions/location-mutations';
import type { SavedLocation, LocationDetailStats, LocationObservation } from '@/features/locations/location-queries';
import QuickAddObservationButton from '@/features/observations/components/QuickAddObservation/QuickAddObservationButton';
import ObservationRow from '@/features/observations/components/ObservationRow/ObservationRow';
import { resizeImage } from '@/shared/lib/image-resize';

interface Props {
  location: SavedLocation;
  stats: LocationDetailStats;
  observations: LocationObservation[];
}

export default function LocationDetail({ location, stats, observations }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const [photoUrl, setPhotoUrl] = useState(location.photoUrl);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDeleteConfirmed() {
    startDeleteTransition(async () => {
      const result = await deleteLocationAction({ id: location.id });
      if ('error' in result) {
        setDeleteError(result.error);
      } else {
        router.push('/locations');
      }
    });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Only image files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Image must be under 10 MB.');
      return;
    }
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append('id', String(location.id));
      formData.append('file', resized, 'location.jpg');
      const timeout = new Promise<{ error: string }>((resolve) =>
        setTimeout(() => resolve({ error: 'Upload timed out.' }), 20000),
      );
      const result = await Promise.race([updateLocationPhotoAction(formData), timeout]);
      if ('error' in result) {
        setPhotoError(result.error);
      } else {
        setPhotoUrl(result.photoUrl);
      }
    } catch {
      setPhotoError('Upload failed. Please try again.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemovePhoto() {
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.append('id', String(location.id));
      formData.append('remove', 'true');
      const result = await updateLocationPhotoAction(formData);
      if ('error' in result) {
        setPhotoError(result.error);
      } else {
        setPhotoUrl(null);
      }
    } finally {
      setPhotoUploading(false);
    }
  }

  const hasStats = stats.observationCount > 0;

  return (
    <div className='flex flex-col gap-5'>
      {/* Photo + header */}
      <div className='rounded-2xl border border-border bg-card overflow-hidden'>
        {photoUrl ? (
          <div className='relative w-full aspect-[2.5/1] sm:aspect-[3/1]'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={location.name}
              className='w-full h-full object-cover'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />
            <div className='absolute bottom-0 left-0 right-0 px-5 pb-4'>
              <h1 className='text-lg font-semibold text-white drop-shadow-sm'>{location.name}</h1>
              <p className='text-[11px] font-mono text-white/70'>
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            </div>
            <div className='absolute top-2 right-2 flex gap-1'>
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                aria-label='Change photo'
                className='rounded-full p-1.5 bg-black/50 text-white hover:bg-black/70 transition-colors'
              >
                <Images className='h-3.5 w-3.5' />
              </button>
              <button
                type='button'
                onClick={handleRemovePhoto}
                disabled={photoUploading}
                aria-label='Remove photo'
                className='rounded-full p-1.5 bg-black/50 text-white hover:bg-black/70 transition-colors'
              >
                <X className='h-3.5 w-3.5' />
              </button>
            </div>
            {photoUploading && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
                <div className='w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin' />
              </div>
            )}
          </div>
        ) : (
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            disabled={photoUploading}
            className='w-full py-6 border-b border-dashed border-border bg-muted/10 flex flex-col items-center gap-1.5 text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-muted/20 transition-colors'
          >
            <Camera className='h-6 w-6' />
            <span className='text-[10px] font-mono uppercase tracking-wider'>
              {photoUploading ? 'Uploading...' : 'Add location photo'}
            </span>
            {photoUploading && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/10'>
                <div className='w-5 h-5 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin' />
              </div>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={handlePhotoChange}
          aria-label='Upload location photo'
        />

        {/* Location info bar */}
        <div className='px-5 py-3.5'>
          {photoError && (
            <div className='mb-3 flex items-start gap-1.5 rounded-md px-2.5 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-mono'>
              <span className='shrink-0 mt-px'>&#9888;</span>
              <span>{photoError}</span>
            </div>
          )}
          {!photoUrl && (
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <h1 className='text-lg font-semibold text-card-foreground truncate'>{location.name}</h1>
                  {location.habitats.length > 0 && (
                    <div className='flex items-center gap-0.5 shrink-0'>
                      {location.habitats.map((h) => (
                        <HexIcon key={h} imageSrc={biomeImage[h]} label={h} size={22} />
                      ))}
                    </div>
                  )}
                </div>
                <p className='text-[11px] font-mono text-muted-foreground/60 mt-0.5'>
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            </div>
          )}
          {photoUrl && location.habitats.length > 0 && (
            <div className='flex items-center gap-0.5'>
              {location.habitats.map((h) => (
                <HexIcon key={h} imageSrc={biomeImage[h]} label={h} size={22} />
              ))}
            </div>
          )}
          <div className='flex items-center gap-2 mt-3'>
            <QuickAddObservationButton
              variant='inline'
              initialLocation={{
                lat: location.lat,
                lng: location.lng,
                locationName: location.name,
                savedLocationId: location.id,
              }}
            />
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => {
                setConfirmDelete(true);
                setDeleteError(null);
              }}
              aria-label='Delete location'
              className='text-muted-foreground hover:text-destructive'
            >
              <Trash2 className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {hasStats && (
        <div className='flex flex-col gap-3'>
          {/* Primary stats */}
          <div className='grid grid-cols-3 gap-2'>
            <PrimaryStat
              icon={<Eye className='h-4 w-4' />}
              label='Observations'
              value={String(stats.observationCount)}
            />
            <PrimaryStat
              icon={<Bird className='h-4 w-4' />}
              label='Species'
              value={String(stats.speciesCount)}
            />
            <PrimaryStat
              icon={<Calendar className='h-4 w-4' />}
              label='Last visit'
              value={stats.lastObservationDate
                ? format(new Date(stats.lastObservationDate), 'd MMM')
                : '—'}
            />
          </div>

          {/* Secondary stats as chips */}
          {(stats.topBird || stats.seenCount > 0 || stats.heardCount > 0 || stats.photographedCount > 0) && (
            <div className='flex flex-wrap gap-1.5'>
              {stats.topBird && (
                <Chip icon={<Star className='h-3 w-3' />}>
                  {stats.topBird.name} · {stats.topBird.count}×
                </Chip>
              )}
              {stats.seenCount > 0 && (
                <Chip icon={<Eye className='h-3 w-3' />}>
                  Seen {stats.seenCount}
                </Chip>
              )}
              {stats.heardCount > 0 && (
                <Chip icon={<Music className='h-3 w-3' />}>
                  Heard {stats.heardCount}
                </Chip>
              )}
              {stats.photographedCount > 0 && (
                <Chip icon={<Camera className='h-3 w-3' />}>
                  Photos {stats.photographedCount}
                </Chip>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent observations */}
      <div>
        <h2 className='text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2'>
          Recent observations
        </h2>
        {observations.length > 0 ? (
          <div className='rounded-xl border border-border bg-card divide-y divide-border'>
            {observations.map((obs) => (
              <ObservationRow key={obs.id} observation={obs} />
            ))}
          </div>
        ) : (
          <div className='rounded-xl border border-dashed border-border bg-card/50 px-6 py-8 text-center'>
            <Bird className='h-8 w-8 text-muted-foreground/20 mx-auto mb-2' />
            <p className='text-sm font-medium text-card-foreground'>No observations yet</p>
            <p className='text-xs text-muted-foreground mt-1'>
              Find a bird in the catalog and log your first sighting here.
            </p>
            <Link href='/birds' className='inline-block mt-3'>
              <Button size='sm' variant='outline'>
                <Plus className='h-3.5 w-3.5' />
                Browse birds
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmDeleteModal
          title='Delete location'
          error={deleteError}
          pending={deletePending}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => {
            setConfirmDelete(false);
            setDeleteError(null);
          }}
        >
          Delete <span className='font-semibold'>{location.name}</span>? This will remove it from your saved places. Your observations will keep their location data.
        </ConfirmDeleteModal>
      )}
    </div>
  );
}

function PrimaryStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className='rounded-xl border border-border bg-card px-3 py-2.5 text-center'>
      <div className='flex items-center justify-center gap-1 text-muted-foreground mb-0.5'>
        {icon}
      </div>
      <p className='text-sm font-semibold text-card-foreground'>{value}</p>
      <p className='text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60'>{label}</p>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className='inline-flex items-center gap-1 rounded-full bg-muted/30 border border-border/50 px-2.5 py-1 text-[11px] text-muted-foreground'>
      {icon}
      {children}
    </span>
  );
}
