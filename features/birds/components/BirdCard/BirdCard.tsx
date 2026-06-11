'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import type { Bird } from '@/entities/bird-domain';
import { RARITY_COLOR } from '@/entities/bird-domain';
import BirdCardFront from './BirdCardFront';
import BirdCardBack from './BirdCardBack';
import BirdCardBackObservation from './BirdCardBackObservation';
import type { SavedLocation } from '@/features/locations/location-queries';
import type { CollectionCardData } from '@/features/observations/observation-queries';

export default function BirdCard({
  bird,
  isAdmin = false,
  isObserved = false,
  isAuthenticated = false,
  savedLocations = [],
  collectionData,
}: {
  bird: Bird;
  isAdmin?: boolean;
  isObserved?: boolean;
  isAuthenticated?: boolean;
  savedLocations?: SavedLocation[];
  collectionData?: CollectionCardData;
}) {
  const [flipped, setFlipped] = useState(false);
  const frameColor = RARITY_COLOR[bird.rarity];

  return (
    <div className='[perspective:1000px] w-full h-full cursor-pointer' onClick={(e) => { if ((e.target as HTMLElement).closest('button, a, input, textarea, select, label')) return; setFlipped(f => !f); }}>
      <div
        className={cn(
          'grid h-full transition-transform duration-500 [transform-style:preserve-3d]',
          flipped && '[transform:rotateY(180deg)]',
        )}
      >
        <BirdCardFront
          bird={bird}
          frameColor={frameColor}
          isAdmin={isAdmin}
          isObserved={isObserved}
          isAuthenticated={isAuthenticated}
          savedLocations={savedLocations}
        />
        {collectionData ? (
          <BirdCardBackObservation
            bird={bird}
            frameColor={frameColor}
            collectionData={collectionData}
            savedLocations={savedLocations}
          />
        ) : (
          <BirdCardBack
            bird={bird}
            frameColor={frameColor}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
}
