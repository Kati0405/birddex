'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import QuickAddObservationModal from './QuickAddObservationModal';
import type { SavedLocation } from '@/features/locations/location-queries';

interface InitialLocation {
  lat: number;
  lng: number;
  locationName: string;
  savedLocationId: number;
}

interface Props {
  savedLocations?: SavedLocation[];
  initialLocation?: InitialLocation;
  variant?: 'header' | 'inline';
}

export default function QuickAddObservationButton({ savedLocations = [], initialLocation, variant = 'header' }: Props) {
  const [open, setOpen] = useState(false);

  if (variant === 'inline') {
    return (
      <>
        <button
          type='button'
          onClick={() => setOpen(true)}
          className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer'
        >
          <Plus className='h-3.5 w-3.5' />
          Add observation
        </button>
        {open && (
          <QuickAddObservationModal
            savedLocations={savedLocations}
            initialLocation={initialLocation}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold font-mono tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all cursor-pointer shadow-sm'
      >
        <Plus className='h-3.5 w-3.5' />
        Log sighting
      </button>
      {open && (
        <QuickAddObservationModal
          savedLocations={savedLocations}
          initialLocation={initialLocation}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
