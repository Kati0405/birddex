'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import type { Bird } from '@/entities/bird-domain';
import { RARITY_COLOR } from '@/entities/bird-domain';
import BirdCardFront from './BirdCardFront';
import BirdCardBack from './BirdCardBack';
import type { SavedLocation } from '@/features/locations/location-queries';

export default function BirdCard({
  bird,
  isAdmin = false,
  isObserved = false,
  isAuthenticated = false,
  savedLocations = [],
}: {
  bird: Bird;
  isAdmin?: boolean;
  isObserved?: boolean;
  isAuthenticated?: boolean;
  savedLocations?: SavedLocation[];
}) {
  const [flipped, setFlipped] = useState(false);
  const frameColor = RARITY_COLOR[bird.rarity];

  return (
    <div className='[perspective:1000px] w-full h-full cursor-pointer' onClick={() => setFlipped(f => !f)}>
      {/*
        Both faces sit in a CSS grid (same cell) so the wrapper height is
        driven by whichever face is taller. Each face is visible/invisible
        via backface-visibility; the inner div rotates on flip.
      */}
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
        <BirdCardBack
          bird={bird}
          frameColor={frameColor}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
