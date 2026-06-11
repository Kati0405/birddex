'use client';

import { useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import type { Bird } from '@/entities/bird-domain';
import { RARITY_COLOR } from '@/entities/bird-domain';
import BirdCardFront from './BirdCardFront';
import BirdCardBack from './BirdCardBack';
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

  // Decide during the capture phase whether the click landed on an interactive
  // element. Capture runs before the target's own onClick, so the clicked node
  // is still attached to the DOM. Doing this check in the bubble-phase onClick
  // is unreliable: an inner tab's handler may call setState and swap its
  // content first, detaching the clicked node — then .closest() returns null
  // and the card flips unintentionally.
  const interactiveClickRef = useRef(false);

  return (
    <div
      className='[perspective:1000px] w-full h-full cursor-pointer'
      onClickCapture={(e) => {
        const target = e.target as HTMLElement | null;
        interactiveClickRef.current = !!target?.closest(
          'button, a, input, textarea, select, label',
        );
      }}
      onClick={() => {
        if (interactiveClickRef.current) return;
        setFlipped((f) => !f);
      }}
    >
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
          isAuthenticated={isAuthenticated}
          isObserved={isObserved}
          savedLocations={savedLocations}
          collectionData={collectionData}
        />
      </div>
    </div>
  );
}
