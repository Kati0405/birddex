'use client';

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveLocationAction, deleteLocationAction } from '@/features/locations/actions/location-mutations';
import type { SavedLocation } from '@/features/locations/location-queries';
import type { LatLng } from '@/features/observations/components/LocationPicker';

const LocationPicker = dynamic(
  () => import('@/features/observations/components/LocationPicker'),
  { ssr: false, loading: () => <div className='h-[220px] rounded-xl bg-secondary' /> }
);

interface Props {
  initial: SavedLocation[];
}

export default function LocationsManager({ initial }: Props) {
  const [locations, setLocations] = useState<SavedLocation[]>(initial);
  const [latLng, setLatLng] = useState<LatLng | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    if (!latLng) { setError('Pick a point on the map first.'); return; }
    if (!name.trim()) { setError('Enter a name for this location.'); return; }
    setError(null);
    startTransition(async () => {
      const result = await saveLocationAction({ name: name.trim(), lat: latLng.lat, lng: latLng.lng });
      if ('error' in result) {
        setError(result.error);
      } else {
        setLocations((prev) => [
          ...prev,
          { id: Date.now(), name: name.trim(), lat: latLng.lat, lng: latLng.lng },
        ]);
        setName('');
        setLatLng(null);
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteLocationAction({ id });
      if (!('error' in result)) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
      }
    });
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='rounded-2xl border border-border bg-card p-6 flex flex-col gap-4'>
        <h2 className='text-sm font-semibold text-card-foreground'>Add new location</h2>

        <div>
          <label className='block text-xs text-muted-foreground mb-2 tracking-wide'>Location name</label>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. City park, backyard feeder…'
            className='w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary'
          />
        </div>

        <LocationPicker value={latLng} onChange={setLatLng} frameColor='#60a5fa' />

        {error && <p className='text-xs text-destructive'>{error}</p>}

        <Button onClick={handleAdd} disabled={pending} className='self-end'>
          {pending ? 'Saving…' : 'Save location'}
        </Button>
      </div>

      {locations.length > 0 && (
        <div className='flex flex-col gap-2'>
          {locations.map((loc) => (
            <div
              key={loc.id}
              className='flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3'
            >
              <div className='flex items-center gap-3'>
                <MapPin className='h-4 w-4 text-muted-foreground shrink-0' />
                <div>
                  <p className='text-sm font-medium text-card-foreground'>{loc.name}</p>
                  <p className='text-xs text-muted-foreground/60 font-mono'>
                    {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => handleDelete(loc.id)}
                disabled={pending}
                className='p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'
              >
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
          ))}
        </div>
      )}

      {locations.length === 0 && (
        <p className='text-xs text-muted-foreground'>No saved locations yet.</p>
      )}
    </div>
  );
}
