'use client';

import { useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { CalendarIcon, Eye, Music, Camera, Images, LocateFixed, MapPin, Map, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { addObservationAction, updateObservationAction, uploadObservationPhotoAction } from '@/features/observations/actions/observation-mutations';
import type { LatLng } from '@/features/observations/components/LocationPicker';
import type { SavedLocation } from '@/features/locations/location-queries';

const LocationPicker = dynamic(
  () => import('@/features/observations/components/LocationPicker'),
  { ssr: false, loading: () => <div className='h-[180px] rounded-lg bg-muted/30' /> }
);

type ObservationQuality = 'bad' | 'good' | 'excellent' | null;

export interface ObservationInitialData {
  observationId: string;
  date: Date;
  seen: boolean;
  heard: boolean;
  photographed: boolean;
  quality: ObservationQuality;
  notes: string | null;
  photoUrl: string | null;
  lat: number | null;
  lng: number | null;
  locationName: string | null;
}

interface AddObservationModalProps {
  birdId: number;
  birdName: string;
  frameColor: string;
  savedLocations?: SavedLocation[];
  initialData?: ObservationInitialData;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddObservationModal({
  birdId,
  birdName,
  frameColor,
  savedLocations = [],
  initialData,
  onClose,
  onSaved,
}: AddObservationModalProps) {
  const isEdit = !!initialData;

  const [date, setDate] = useState<Date>(initialData?.date ?? new Date());
  const [locationMode, setLocationMode] = useState<'map' | 'saved'>(
    savedLocations.length > 0 ? 'saved' : 'map'
  );
  const [latLng, setLatLng] = useState<LatLng | null>(
    initialData?.lat != null && initialData?.lng != null
      ? { lat: initialData.lat, lng: initialData.lng, locationName: initialData.locationName ?? undefined }
      : null
  );
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);
  const [seen, setSeen] = useState(initialData?.seen ?? false);
  const [heard, setHeard] = useState(initialData?.heard ?? false);
  const [photographed, setPhotographed] = useState(initialData?.photographed ?? false);
  const [quality, setQuality] = useState<ObservationQuality>(initialData?.quality ?? null);
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoUrl ?? null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialData?.photoUrl ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolvedLatLng: LatLng | null = (() => {
    if (locationMode !== 'saved') return latLng;
    const saved = savedLocations.find((l) => l.id === selectedSavedId);
    if (!saved) return null;
    return { lat: saved.lat, lng: saved.lng, locationName: saved.name };
  })();

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    setPhotoError(null);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const timeout = new Promise<{ error: string }>((resolve) =>
        setTimeout(() => resolve({ error: 'Upload timed out. Check your connection and try again.' }), 20000)
      );
      const result = await Promise.race([uploadObservationPhotoAction(formData), timeout]);
      if ('error' in result) {
        setPhotoError(result.error);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setPhotoUrl(result.url);
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
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const payload = {
        observedAt: date,
        lat: resolvedLatLng?.lat ?? null,
        lng: resolvedLatLng?.lng ?? null,
        locationName: resolvedLatLng?.locationName ?? null,
        seen,
        heard,
        photographed,
        quality,
        notes: notes.trim() || null,
        photoUrl,
      };

      const result = isEdit
        ? await updateObservationAction({ id: initialData!.observationId, ...payload })
        : await addObservationAction({ birdId, ...payload });

      if ('error' in result) {
        setError(result.error);
      } else {
        onSaved();
        onClose();
      }
    });
  }

  const evidence = [
    { key: 'seen',         Icon: Eye,    label: 'Seen',         value: seen,         toggle: () => setSeen(!seen) },
    { key: 'heard',        Icon: Music,  label: 'Heard',        value: heard,        toggle: () => setHeard(!heard) },
    { key: 'photographed', Icon: Camera, label: 'Photographed', value: photographed, toggle: () => setPhotographed(!photographed) },
  ];

  const qualities: { key: ObservationQuality; label: string }[] = [
    { key: 'bad',       label: 'Brief glance' },
    { key: 'good',      label: 'Good view'    },
    { key: 'excellent', label: 'Excellent'    },
  ];

  return createPortal(
    <div
      className='fixed inset-0 z-[110] flex items-center justify-center p-4'
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { e.stopPropagation(); e.target === e.currentTarget && onClose(); }}
    >
      <div
        className='relative w-full max-w-sm rounded-xl overflow-hidden flex flex-col bg-card'
        style={{
          border: `2px solid ${frameColor}70`,
          boxShadow: `0 8px 40px ${frameColor}30, 0 2px 12px rgba(0,0,0,0.25)`,
          maxHeight: '90vh',
        }}
      >
        <div className='h-1 w-full shrink-0' style={{ background: frameColor }} />

        <button
          type='button'
          onClick={onClose}
          aria-label='Close'
          className='absolute top-3 right-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors'
        >
          <X className='h-3.5 w-3.5' />
        </button>

        <div className='overflow-y-auto flex-1 px-5 pt-4 pb-3 flex flex-col gap-3'>

          <div>
            <p className='text-[7px] uppercase tracking-[0.18em] font-mono mb-0.5 text-muted-foreground'>
              {isEdit ? 'Edit observation' : 'Log observation'}
            </p>
            <p className='text-sm font-semibold text-card-foreground leading-tight'>{birdName}</p>
          </div>

          <Section label='How observed' frameColor={frameColor}>
            <div className='flex gap-1.5'>
              {evidence.map(({ key, Icon, label, value, toggle }) => (
                <button
                  key={key}
                  type='button'
                  onClick={toggle}
                  aria-pressed={value}
                  className='flex-1 flex flex-col items-center gap-1 py-2 rounded-md text-[9px] font-mono uppercase tracking-[0.05em] transition-all'
                  style={value
                    ? { background: `${frameColor}20`, border: `1px solid ${frameColor}`, color: frameColor }
                    : { background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                  }
                >
                  <Icon className='h-3.5 w-3.5' />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section label='Date' frameColor={frameColor}>
            <Popover>
              <PopoverTrigger render={
                <button
                  type='button'
                  className='w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-mono text-card-foreground border border-border hover:border-muted-foreground/50 transition-colors bg-background/60'
                >
                  <CalendarIcon className='h-3 w-3 shrink-0 text-muted-foreground' />
                  {format(date, 'dd MMM yyyy')}
                </button>
              } />
              <PopoverContent className='w-auto p-0 !z-[120]' align='start'>
                <Calendar
                  mode='single'
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={{ after: new Date() }}
                  captionLayout='dropdown'
                  defaultMonth={date}
                />
              </PopoverContent>
            </Popover>
          </Section>

          <Section
            label='Location'
            frameColor={frameColor}
            trailing={
              savedLocations.length > 0 ? (
                <div className='flex gap-0.5 p-0.5 rounded border border-border bg-muted/40'>
                  {(['saved', 'map'] as const).map((mode) => (
                    <button
                      key={mode}
                      type='button'
                      onClick={() => setLocationMode(mode)}
                      className='flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wide transition-all'
                      style={locationMode === mode
                        ? { background: frameColor, color: 'white' }
                        : { color: 'var(--muted-foreground)' }
                      }
                    >
                      {mode === 'saved' ? <MapPin className='h-2 w-2' /> : <Map className='h-2 w-2' />}
                      {mode}
                    </button>
                  ))}
                </div>
              ) : null
            }
          >
            {locationMode === 'saved' ? (
              <div className='flex flex-col gap-1'>
                {savedLocations.map((loc) => {
                  const active = selectedSavedId === loc.id;
                  return (
                    <button
                      key={loc.id}
                      type='button'
                      onClick={() => setSelectedSavedId(active ? null : loc.id)}
                      aria-pressed={active}
                      className='flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all'
                      style={active
                        ? { background: `${frameColor}18`, border: `1px solid ${frameColor}`, color: frameColor }
                        : { background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--card-foreground)' }
                      }
                    >
                      <LocateFixed className='h-3 w-3 shrink-0 text-muted-foreground' />
                      <span className='text-[10px] font-mono'>{loc.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <LocationPicker value={latLng} onChange={setLatLng} frameColor={frameColor} />
            )}
          </Section>

          <Section label='Quality' frameColor={frameColor}>
            <div className='flex gap-1.5'>
              {qualities.map(({ key, label }) => {
                const active = quality === key;
                return (
                  <button
                    key={key}
                    type='button'
                    onClick={() => setQuality(active ? null : key)}
                    aria-pressed={active}
                    className='flex-1 py-1.5 rounded-md text-[9px] font-mono tracking-[0.04em] uppercase transition-all'
                    style={active
                      ? { background: `${frameColor}20`, border: `1px solid ${frameColor}`, color: frameColor }
                      : { background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section label='Notes' frameColor={frameColor}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='What happened?'
              maxLength={2000}
              rows={2}
              aria-label='Observation notes'
              className='w-full rounded-md px-2.5 py-1.5 text-[11px] font-mono text-card-foreground placeholder:text-muted-foreground/50 resize-none leading-relaxed focus:outline-none border border-border bg-background/60 transition-colors focus:border-muted-foreground/50'
            />
          </Section>

          <Section label='Photo' frameColor={frameColor}>
            {photoError && (
              <div className='mb-2 flex items-start gap-1.5 rounded-md px-2.5 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-mono'>
                <span className='shrink-0 mt-px'>⚠</span>
                <span>{photoError}</span>
              </div>
            )}
            {photoPreview ? (
              <div className='relative rounded-md overflow-hidden'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt='Observation photo' className='w-full max-h-36 object-cover' />
                {photoUploading && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
                    <div
                      className='w-5 h-5 rounded-full border-2 border-t-transparent animate-spin'
                      style={{ borderColor: `${frameColor} transparent transparent transparent` }}
                    />
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
                className='group flex w-full flex-col items-center justify-center gap-1.5 py-5 rounded-md border-2 border-dashed border-border hover:border-muted-foreground/40 text-[9px] font-mono uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground transition-all bg-muted/20 hover:bg-muted/30'
              >
                <Images className='h-5 w-5 transition-transform group-hover:scale-110 duration-150' />
                <span>Add a photo</span>
                {photographed && (
                  <span className='normal-case tracking-normal text-muted-foreground/70'>
                    You marked this as photographed
                  </span>
                )}
              </button>
            )}
            <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handlePhotoChange} />
          </Section>

        </div>

        <div className='shrink-0 px-5 py-3 flex items-center justify-between gap-2 border-t border-border bg-muted/20'>
          {error ? (
            <p className='text-[10px] font-mono text-destructive'>⚠ {error}</p>
          ) : (
            <span />
          )}
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={onClose}
              disabled={pending || photoUploading}
              className='px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.1em] border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={handleSave}
              disabled={pending || photoUploading}
              className='px-4 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.1em] text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-60'
              style={{ background: frameColor, boxShadow: `0 2px 8px ${frameColor}50` }}
            >
              {pending ? 'Saving…' : isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Section({
  label,
  frameColor,
  trailing,
  children,
}: {
  label: string;
  frameColor: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className='rounded-lg p-2.5'
      style={{ background: `${frameColor}08`, border: `1px solid ${frameColor}25` }}
    >
      <div className='flex items-center justify-between mb-2'>
        <p className='text-[7px] uppercase tracking-[0.18em] font-mono text-muted-foreground'>
          {label}
        </p>
        {trailing}
      </div>
      {children}
    </div>
  );
}
