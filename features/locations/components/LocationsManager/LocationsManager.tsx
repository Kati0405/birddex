'use client';

import { useRef, useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Trash2, MapPin, Plus, ChevronUp, MapPinned, Images, X, Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDeleteModal from '@/shared/ui/ConfirmDeleteModal/ConfirmDeleteModal';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import {
  saveLocationAction,
  deleteLocationAction,
  updateLocationAction,
  uploadLocationPhotoAction,
  updateLocationPhotoAction,
} from '@/features/locations/actions/location-mutations';
import { BIOMES, biomeImage } from '@/entities/bird-domain';
import type { Biome } from '@/entities/bird-domain';
import type { SavedLocation, LocationStats } from '@/features/locations/location-queries';
import type { LatLng } from '@/features/observations/components/LocationPicker';

const LocationPicker = dynamic(
  () => import('@/features/observations/components/LocationPicker'),
  { ssr: false, loading: () => <div className='h-[200px] rounded-xl bg-secondary' /> }
);

interface Props {
  initial: SavedLocation[];
  stats: Record<string, LocationStats>;
}

function resizeImage(file: File, maxPx = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function LocationsManager({ initial, stats }: Props) {
  const [locations, setLocations] = useState<SavedLocation[]>(initial);
  const [latLng, setLatLng] = useState<LatLng | null>(null);
  const [name, setName] = useState('');
  const [selectedHabitats, setSelectedHabitats] = useState<Biome[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(initial.length === 0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editLatLng, setEditLatLng] = useState<LatLng | null>(null);
  const [editHabitats, setEditHabitats] = useState<Biome[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, startEditTransition] = useTransition();

  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [editPhotoPublicId, setEditPhotoPublicId] = useState<string | null>(null);
  const [editPhotoUploading, setEditPhotoUploading] = useState(false);
  const [editPhotoError, setEditPhotoError] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPublicId, setPhotoPublicId] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleHabitat(biome: Biome) {
    setSelectedHabitats((prev) => {
      if (prev.includes(biome)) return prev.filter((b) => b !== biome);
      if (prev.length >= 3) return prev;
      return [...prev, biome];
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
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append('file', resized, 'location.jpg');
      const timeout = new Promise<{ error: string }>((resolve) =>
        setTimeout(() => resolve({ error: 'Upload timed out. Check your connection and try again.' }), 20000),
      );
      const result = await Promise.race([uploadLocationPhotoAction(formData), timeout]);
      if ('error' in result) {
        setPhotoError(result.error);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setPhotoUrl(result.url);
        setPhotoPublicId(result.publicId);
      }
    } catch {
      setPhotoError('Upload failed. Please try again.');
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setPhotoUploading(false);
    }
  }

  function removePhoto() {
    setPhotoPreview(null);
    setPhotoUrl(null);
    setPhotoPublicId(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function startEditing(loc: SavedLocation) {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditLatLng({ lat: loc.lat, lng: loc.lng });
    setEditHabitats([...loc.habitats]);
    setEditError(null);
    setEditPhotoPreview(loc.photoUrl);
    setEditPhotoUrl(loc.photoUrl);
    setEditPhotoPublicId(loc.photoPublicId);
    setEditPhotoUploading(false);
    setEditPhotoError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditError(null);
    setEditPhotoPreview(null);
    setEditPhotoUrl(null);
    setEditPhotoPublicId(null);
    setEditPhotoError(null);
  }

  async function handleEditPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEditPhotoError('Only image files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEditPhotoError('Image must be under 10 MB.');
      return;
    }
    setEditPhotoPreview(URL.createObjectURL(file));
    setEditPhotoUploading(true);
    setEditPhotoError(null);
    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append('file', resized, 'location.jpg');
      const timeout = new Promise<{ error: string }>((resolve) =>
        setTimeout(() => resolve({ error: 'Upload timed out. Check your connection and try again.' }), 20000),
      );
      const result = await Promise.race([uploadLocationPhotoAction(formData), timeout]);
      if ('error' in result) {
        setEditPhotoError(result.error);
        setEditPhotoPreview(null);
        if (editFileInputRef.current) editFileInputRef.current.value = '';
      } else {
        setEditPhotoUrl(result.url);
        setEditPhotoPublicId(result.publicId);
      }
    } catch {
      setEditPhotoError('Upload failed. Please try again.');
      setEditPhotoPreview(null);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    } finally {
      setEditPhotoUploading(false);
    }
  }

  function removeEditPhoto() {
    setEditPhotoPreview(null);
    setEditPhotoUrl(null);
    setEditPhotoPublicId(null);
    setEditPhotoError(null);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  }

  function toggleEditHabitat(biome: Biome) {
    setEditHabitats((prev) => {
      if (prev.includes(biome)) return prev.filter((b) => b !== biome);
      if (prev.length >= 3) return prev;
      return [...prev, biome];
    });
  }

  function handleEditSave(loc: SavedLocation) {
    if (!editLatLng) { setEditError('Pick a point on the map.'); return; }
    if (!editName.trim()) { setEditError('Enter a name.'); return; }
    if (editPhotoUploading) { setEditError('Wait for photo upload to finish.'); return; }
    setEditError(null);
    startEditTransition(async () => {
      const result = await updateLocationAction({
        id: loc.id,
        name: editName.trim(),
        lat: editLatLng.lat,
        lng: editLatLng.lng,
        habitats: editHabitats,
        oldName: loc.name,
      });
      if ('error' in result) {
        setEditError(result.error);
        return;
      }

      const photoChanged = editPhotoUrl !== loc.photoUrl;
      if (photoChanged) {
        const photoResult = await updateLocationPhotoAction({
          id: loc.id,
          photoUrl: editPhotoUrl,
          photoPublicId: editPhotoPublicId,
          oldPhotoPublicId: loc.photoPublicId,
        });
        if ('error' in photoResult) {
          setEditError(photoResult.error);
          return;
        }
      }

      setLocations((prev) =>
        prev.map((l) =>
          l.id === loc.id
            ? {
                ...l,
                name: editName.trim(),
                lat: editLatLng.lat,
                lng: editLatLng.lng,
                habitats: editHabitats,
                photoUrl: editPhotoUrl,
                photoPublicId: editPhotoPublicId,
              }
            : l
        )
      );
      setEditingId(null);
    });
  }

  function handleAdd() {
    if (!latLng) { setError('Pick a point on the map first.'); return; }
    if (!name.trim()) { setError('Enter a name for this location.'); return; }
    if (photoUploading) { setError('Wait for photo upload to finish.'); return; }
    setError(null);
    startTransition(async () => {
      const result = await saveLocationAction({
        name: name.trim(),
        lat: latLng.lat,
        lng: latLng.lng,
        photoUrl: photoUrl ?? null,
        photoPublicId: photoPublicId ?? null,
        habitats: selectedHabitats,
      });
      if ('error' in result) {
        setError(result.error);
      } else {
        setLocations((prev) => [
          ...prev,
          {
            id: Date.now(),
            name: name.trim(),
            lat: latLng.lat,
            lng: latLng.lng,
            photoUrl: photoUrl ?? null,
            photoPublicId: photoPublicId ?? null,
            habitats: selectedHabitats,
          },
        ]);
        setName('');
        setLatLng(null);
        setSelectedHabitats([]);
        removePhoto();
        setFormOpen(false);
      }
    });
  }

  function handleDeleteConfirmed() {
    if (deletingId === null) return;
    const id = deletingId;
    startDeleteTransition(async () => {
      const result = await deleteLocationAction({ id });
      if ('error' in result) {
        setDeleteError(result.error);
      } else {
        setLocations((prev) => prev.filter((l) => l.id !== id));
        setDeletingId(null);
        setDeleteError(null);
      }
    });
  }

  const isValid = name.trim().length > 0 && latLng !== null && !photoUploading;
  const deletingLocation = locations.find((l) => l.id === deletingId);

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-xl font-semibold font-heading text-foreground'>My Locations</h1>
          <p className='text-xs mt-1 text-muted-foreground'>
            Save your usual birdwatching spots and reuse them when logging observations.
          </p>
        </div>
        {locations.length > 0 && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => setFormOpen((o) => !o)}
            className='shrink-0'
          >
            {formOpen ? (
              <>
                <ChevronUp className='h-3.5 w-3.5' />
                <span className='hidden sm:inline'>Close</span>
              </>
            ) : (
              <>
                <Plus className='h-3.5 w-3.5' />
                <span className='hidden sm:inline'>Add location</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Add location form */}
      {formOpen && (
        <div className='rounded-2xl border border-border bg-card p-5 flex flex-col gap-5'>
          <h2 className='text-sm font-semibold text-card-foreground'>Add new location</h2>

          <div>
            <label htmlFor='location-name' className='block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider'>
              Name this place
            </label>
            <input
              id='location-name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. City park, backyard feeder, river path...'
              className='w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary'
            />
          </div>

          <div>
            <label className='block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider'>
              Pick it on the map
            </label>
            <p className='text-[11px] text-muted-foreground/60 mb-2'>
              Search for a place or click the map to drop a pin.
            </p>
            <LocationPicker value={latLng} onChange={setLatLng} frameColor='#60a5fa' />
          </div>

          <div className='rounded-lg bg-muted/30 border border-border/50 px-3 py-2'>
            {latLng ? (
              <div>
                <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>Selected point</p>
                <p className='text-sm font-mono text-foreground'>
                  {latLng.lat.toFixed(4)}, {latLng.lng.toFixed(4)}
                </p>
              </div>
            ) : (
              <p className='text-xs text-muted-foreground/60'>No point selected yet.</p>
            )}
          </div>

          {/* Habitat selector */}
          <div>
            <label className='block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider'>
              Habitats (optional, up to 3)
            </label>
            <div className='flex flex-wrap gap-1.5'>
              {BIOMES.map((biome) => {
                const active = selectedHabitats.includes(biome);
                const disabled = !active && selectedHabitats.length >= 3;
                return (
                  <button
                    key={biome}
                    type='button'
                    onClick={() => toggleHabitat(biome)}
                    disabled={disabled}
                    aria-pressed={active}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-mono capitalize transition-all border ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : disabled
                          ? 'border-border/50 bg-muted/20 text-muted-foreground/30 cursor-not-allowed'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    <HexIcon imageSrc={biomeImage[biome]} label={undefined} size={20} />
                    {biome}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className='block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider'>
              Photo (optional)
            </label>
            {photoError && (
              <div className='mb-2 flex items-start gap-1.5 rounded-md px-2.5 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-mono'>
                <span className='shrink-0 mt-px'>&#9888;</span>
                <span>{photoError}</span>
              </div>
            )}
            {photoPreview ? (
              <div className='relative rounded-lg overflow-hidden'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt='Location preview' className='w-full max-h-40 object-cover' />
                {photoUploading && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
                    <div className='w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin' />
                  </div>
                )}
                {!photoUploading && (
                  <button
                    type='button'
                    onClick={removePhoto}
                    aria-label='Remove photo'
                    className='absolute top-1.5 right-1.5 rounded-full p-1 bg-black/50 text-white hover:bg-black/70 transition-colors'
                  >
                    <X className='h-3 w-3' />
                  </button>
                )}
              </div>
            ) : (
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='group flex w-full flex-col items-center justify-center gap-1.5 py-5 rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all bg-muted/20 hover:bg-muted/30'
              >
                <Images className='h-5 w-5 transition-transform group-hover:scale-110 duration-150' />
                <span>Add a photo of this place</span>
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
          </div>

          {error && <p className='text-xs text-destructive'>{error}</p>}

          <div className='flex justify-end'>
            <Button
              onClick={handleAdd}
              disabled={pending || !isValid}
              className={!isValid ? 'opacity-50' : ''}
            >
              {pending ? 'Saving...' : 'Save location'}
            </Button>
          </div>
        </div>
      )}

      {/* Saved locations */}
      {locations.length > 0 && (
        <div className='flex flex-col gap-2'>
          <h2 className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Your places
          </h2>
          <div className='flex flex-col gap-2'>
            {locations.map((loc) => {
              const locStats = stats[loc.name];
              const isEditing = editingId === loc.id;

              if (isEditing) {
                return (
                  <div key={loc.id} className='rounded-2xl border border-primary/30 bg-card p-5 flex flex-col gap-5'>
                    <h2 className='text-sm font-semibold text-card-foreground'>Edit location</h2>

                    <div>
                      <label htmlFor={`edit-name-${loc.id}`} className='block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider'>
                        Name
                      </label>
                      <input
                        id={`edit-name-${loc.id}`}
                        type='text'
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className='w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary'
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider'>
                        Location on the map
                      </label>
                      <p className='text-[11px] text-muted-foreground/60 mb-2'>
                        Search for a place or click the map to move the pin.
                      </p>
                      <LocationPicker value={editLatLng} onChange={setEditLatLng} frameColor='#60a5fa' />
                    </div>

                    <div className='rounded-lg bg-muted/30 border border-border/50 px-3 py-2'>
                      {editLatLng ? (
                        <div>
                          <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>Selected point</p>
                          <p className='text-sm font-mono text-foreground'>
                            {editLatLng.lat.toFixed(4)}, {editLatLng.lng.toFixed(4)}
                          </p>
                        </div>
                      ) : (
                        <p className='text-xs text-muted-foreground/60'>No point selected.</p>
                      )}
                    </div>

                    <div>
                      <label className='block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider'>
                        Habitats (optional, up to 3)
                      </label>
                      <div className='flex flex-wrap gap-1.5'>
                        {BIOMES.map((biome) => {
                          const active = editHabitats.includes(biome);
                          const disabled = !active && editHabitats.length >= 3;
                          return (
                            <button
                              key={biome}
                              type='button'
                              onClick={() => toggleEditHabitat(biome)}
                              disabled={disabled}
                              aria-pressed={active}
                              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-mono capitalize transition-all border ${
                                active
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : disabled
                                    ? 'border-border/50 bg-muted/20 text-muted-foreground/30 cursor-not-allowed'
                                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                              }`}
                            >
                              <HexIcon imageSrc={biomeImage[biome]} label={undefined} size={20} />
                              {biome}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Photo upload */}
                    <div>
                      <label className='block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider'>
                        Photo
                      </label>
                      {editPhotoError && (
                        <div className='mb-2 flex items-start gap-1.5 rounded-md px-2.5 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-mono'>
                          <span className='shrink-0 mt-px'>&#9888;</span>
                          <span>{editPhotoError}</span>
                        </div>
                      )}
                      {editPhotoPreview ? (
                        <div className='relative rounded-lg overflow-hidden'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={editPhotoPreview} alt='Location preview' className='w-full max-h-40 object-cover' />
                          {editPhotoUploading && (
                            <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
                              <div className='w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin' />
                            </div>
                          )}
                          {!editPhotoUploading && (
                            <div className='absolute top-1.5 right-1.5 flex gap-1'>
                              <button
                                type='button'
                                onClick={() => editFileInputRef.current?.click()}
                                aria-label='Change photo'
                                className='rounded-full p-1 bg-black/50 text-white hover:bg-black/70 transition-colors'
                              >
                                <Images className='h-3 w-3' />
                              </button>
                              <button
                                type='button'
                                onClick={removeEditPhoto}
                                aria-label='Remove photo'
                                className='rounded-full p-1 bg-black/50 text-white hover:bg-black/70 transition-colors'
                              >
                                <X className='h-3 w-3' />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type='button'
                          onClick={() => editFileInputRef.current?.click()}
                          className='group flex w-full flex-col items-center justify-center gap-1.5 py-5 rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all bg-muted/20 hover:bg-muted/30'
                        >
                          <Images className='h-5 w-5 transition-transform group-hover:scale-110 duration-150' />
                          <span>Add a photo of this place</span>
                        </button>
                      )}
                      <input
                        ref={editFileInputRef}
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={handleEditPhotoChange}
                        aria-label='Upload location photo'
                      />
                    </div>

                    {editError && <p className='text-xs text-destructive'>{editError}</p>}

                    <div className='flex justify-end gap-2'>
                      <Button variant='ghost' size='sm' onClick={cancelEditing} disabled={editPending}>
                        Cancel
                      </Button>
                      <Button
                        size='sm'
                        onClick={() => handleEditSave(loc)}
                        disabled={editPending || !editName.trim() || !editLatLng}
                      >
                        {editPending ? 'Saving...' : 'Save changes'}
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={loc.id}
                  className='flex items-center rounded-xl border border-border bg-card overflow-hidden transition-colors hover:bg-card/80'
                >
                  {/* Photo preview / placeholder */}
                  <div className='h-16 w-16 sm:h-18 sm:w-18 shrink-0 bg-muted/40 flex items-center justify-center'>
                    {loc.photoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={loc.photoUrl}
                        alt={loc.name}
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <MapPin className='h-5 w-5 text-muted-foreground/40' />
                    )}
                  </div>
                  {/* Info */}
                  <div className='flex flex-1 items-center justify-between px-3 py-2.5 min-w-0 gap-2'>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-1.5'>
                        <p className='text-sm font-medium text-card-foreground truncate'>{loc.name}</p>
                        {loc.habitats.length > 0 && (
                          <div className='flex items-center gap-0.5 shrink-0'>
                            {loc.habitats.map((h) => (
                              <HexIcon key={h} imageSrc={biomeImage[h]} label={h} size={18} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
                        <p className='text-[11px] text-muted-foreground/60 font-mono'>
                          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                        </p>
                        {locStats && locStats.observationCount > 0 && (
                          <p className='text-[11px] text-muted-foreground'>
                            {locStats.observationCount} obs · {locStats.speciesCount} species
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='flex items-center gap-1 shrink-0'>
                      <Link
                        href={`/locations/${loc.id}`}
                        className='p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors'
                        aria-label={`View ${loc.name}`}
                      >
                        <Eye className='h-4 w-4' />
                      </Link>
                      <button
                        type='button'
                        onClick={() => startEditing(loc)}
                        aria-label={`Edit ${loc.name}`}
                        className='p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors'
                      >
                        <Pencil className='h-4 w-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setDeletingId(loc.id);
                          setDeleteError(null);
                        }}
                        disabled={deletePending}
                        aria-label={`Delete ${loc.name}`}
                        className='p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {locations.length === 0 && !formOpen && (
        <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4'>
            <MapPinned className='h-6 w-6 text-primary' />
          </div>
          <h2 className='text-sm font-semibold text-card-foreground'>No saved locations yet</h2>
          <p className='text-xs text-muted-foreground mt-1 max-w-xs'>
            Save your usual birdwatching spots so you can quickly select them when logging observations.
          </p>
          <Button
            variant='outline'
            size='sm'
            className='mt-4'
            onClick={() => setFormOpen(true)}
          >
            <Plus className='h-3.5 w-3.5' />
            Add your first location
          </Button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId !== null && deletingLocation && (
        <ConfirmDeleteModal
          title='Delete location'
          error={deleteError}
          pending={deletePending}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => {
            setDeletingId(null);
            setDeleteError(null);
          }}
        >
          Delete <span className='font-semibold'>{deletingLocation.name}</span>? This will remove it from your saved places. Your observations will keep their location data.
        </ConfirmDeleteModal>
      )}
    </div>
  );
}
