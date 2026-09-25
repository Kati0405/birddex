'use client';

import { useState } from 'react';
import { Plus, Binoculars } from 'lucide-react';
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
  variant?: 'header' | 'inline' | 'floating';
  className?: string;
}

export default function QuickAddObservationButton({ savedLocations = [], initialLocation, variant = 'header', className = '' }: Props) {
  const [open, setOpen] = useState(false);

  if (variant === 'floating') {
    return (
      <>
        <button
          type='button'
          onClick={() => setOpen(true)}
          className='fixed bottom-6 right-4 sm:right-[clamp(1rem,4vw,3rem)] z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform'
          aria-label='Add observation'
        >
          <Binoculars size={24} />
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

  if (variant === 'inline') {
    return (
      <>
        <button
          type='button'
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer ${className}`}
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
