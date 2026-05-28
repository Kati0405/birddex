'use client';

import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { addObservationAction } from '@/features/observations/actions/observation-mutations';
import type { LatLng } from '@/features/observations/components/LocationPicker';
import type { SavedLocation } from '@/features/locations/location-queries';

const LocationPicker = dynamic(
  () => import('@/features/observations/components/LocationPicker'),
  { ssr: false, loading: () => <div className='h-[220px] rounded-xl bg-secondary' /> }
);

interface AddObservationModalProps {
  birdId: number;
  birdName: string;
  frameColor: string;
  savedLocations?: SavedLocation[];
  onClose: () => void;
  onSaved: () => void;
}

export default function AddObservationModal({
  birdId,
  birdName,
  frameColor,
  savedLocations = [],
  onClose,
  onSaved,
}: AddObservationModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [locationMode, setLocationMode] = useState<'map' | 'saved'>(
    savedLocations.length > 0 ? 'saved' : 'map'
  );
  const [latLng, setLatLng] = useState<LatLng | null>(null);
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resolvedLatLng: LatLng | null =
    locationMode === 'saved'
      ? (savedLocations.find((l) => l.id === selectedSavedId) ?? null)
      : latLng;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await addObservationAction({
        birdId,
        observedAt: date,
        lat: resolvedLatLng?.lat ?? null,
        lng: resolvedLatLng?.lng ?? null,
      });
      if ('error' in result) {
        setError(result.error);
      } else {
        onSaved();
        onClose();
      }
    });
  }

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60'
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className='relative w-full max-w-lg rounded-2xl overflow-hidden bg-card border border-border shadow-2xl'
        style={{ boxShadow: `0 12px 60px ${frameColor}25` }}
      >
        <div className='h-1.5 w-full' style={{ background: frameColor }} />

        <div className='px-8 pt-7 pb-8'>
          <div className='mb-6'>
            <h2 className='text-lg font-semibold text-card-foreground'>Add observation</h2>
            <p className='text-sm text-muted-foreground italic mt-1'>{birdName}</p>
          </div>

          <div className='mb-6'>
            <label className='block text-xs text-muted-foreground mb-2 tracking-wide'>
              When did you observe this bird?
            </label>
            <Popover>
              <PopoverTrigger render={
                <Button variant='outline' className='w-full justify-start text-left font-normal'>
                  <CalendarIcon className='mr-2 h-4 w-4 text-muted-foreground' />
                  {format(date, 'dd MMMM yyyy')}
                </Button>
              } />
              <PopoverContent className='w-auto p-0' align='start'>
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
          </div>

          <div className='mb-6'>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-xs text-muted-foreground tracking-wide'>
                Where did you see it? <span className='text-muted-foreground/60'>(optional)</span>
              </span>
              {savedLocations.length > 0 && (
                <div className='flex gap-1 p-0.5 rounded-lg bg-secondary'>
                  <button
                    type='button'
                    onClick={() => setLocationMode('saved')}
                    className='flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors'
                    style={locationMode === 'saved' ? { background: frameColor + '22', color: frameColor } : {}}
                  >
                    <MapPin className='h-3 w-3' />
                    Saved
                  </button>
                  <button
                    type='button'
                    onClick={() => setLocationMode('map')}
                    className='flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors'
                    style={locationMode === 'map' ? { background: frameColor + '22', color: frameColor } : {}}
                  >
                    <Map className='h-3 w-3' />
                    Map
                  </button>
                </div>
              )}
            </div>

            {locationMode === 'saved' ? (
              <div className='flex flex-col gap-1.5'>
                {savedLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type='button'
                    onClick={() => setSelectedSavedId(loc.id === selectedSavedId ? null : loc.id)}
                    className='flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors'
                    style={
                      selectedSavedId === loc.id
                        ? { borderColor: frameColor, background: frameColor + '12' }
                        : { borderColor: 'var(--border)' }
                    }
                  >
                    <MapPin className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
                    <div>
                      <p className='text-sm text-card-foreground'>{loc.name}</p>
                      <p className='text-[10px] font-mono text-muted-foreground/60'>
                        {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <LocationPicker value={latLng} onChange={setLatLng} frameColor={frameColor} />
            )}
          </div>

          {error && <p className='text-xs text-destructive mb-4'>{error}</p>}

          <div className='flex gap-3 justify-end'>
            <Button variant='outline' onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={pending} style={{ background: frameColor, borderColor: frameColor }}>
              {pending ? 'Saving…' : 'Save observation'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
