'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import type { Bird, Biome, Food, Behaviour, Rarity } from '@/entities/bird-domain';
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
  initialFlipped = false,
  initialObsId,
  onToggleFood,
  onToggleBiome,
  onToggleBehaviour,
  onToggleRarity,
  selectedFoods,
  selectedBiomes,
  selectedBehaviours,
  selectedRarities,
}: {
  bird: Bird;
  isAdmin?: boolean;
  isObserved?: boolean;
  isAuthenticated?: boolean;
  savedLocations?: SavedLocation[];
  collectionData?: CollectionCardData;
  initialFlipped?: boolean;
  initialObsId?: string;
  onToggleFood?: (food: Food) => void;
  onToggleBiome?: (biome: Biome) => void;
  onToggleBehaviour?: (behaviour: Behaviour) => void;
  onToggleRarity?: (rarity: Rarity) => void;
  selectedFoods?: Set<Food>;
  selectedBiomes?: Set<Biome>;
  selectedBehaviours?: Set<Behaviour>;
  selectedRarities?: Set<Rarity>;
}) {
  const [flipped, setFlipped] = useState(initialFlipped);
  const frameColor = RARITY_COLOR[bird.rarity];

  // Each face owns a background click handler that flips the card. Interactive
  // controls inside a face call stopPropagation on their own click, so they
  // never reach this handler — that's what keeps a button press from flipping
  // the card. We deliberately avoid inferring intent from the clicked DOM node
  // (e.g. target.closest(...)): an inner control's click can re-render and swap
  // its own subtree mid-event, which made such heuristics flip unintentionally.
  const flip = () => setFlipped((f) => !f);

  return (
    <div className='[perspective:1000px] w-full h-full cursor-pointer'>
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
          onFlip={flip}
          active={!flipped}
          onToggleFood={onToggleFood}
          onToggleBiome={onToggleBiome}
          onToggleBehaviour={onToggleBehaviour}
          onToggleRarity={onToggleRarity}
          selectedFoods={selectedFoods}
          selectedBiomes={selectedBiomes}
          selectedBehaviours={selectedBehaviours}
          selectedRarities={selectedRarities}
        />
        <BirdCardBack
          bird={bird}
          frameColor={frameColor}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          isObserved={isObserved}
          savedLocations={savedLocations}
          collectionData={collectionData}
          onFlip={flip}
          active={flipped}
          initialObsId={initialObsId}
        />
      </div>
    </div>
  );
}
