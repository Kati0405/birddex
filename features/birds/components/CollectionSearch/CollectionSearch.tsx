'use client';

import { useState, useMemo } from 'react';
import type { Bird } from '@/entities/bird-domain';
import type { SavedLocation } from '@/features/locations/location-queries';
import type { CollectionCardData } from '@/features/observations/observation-queries';
import BirdGrid from '@/features/birds/components/BirdGrid/BirdGrid';
import BirdSearchBar from '@/features/birds/components/BirdSearchBar/BirdSearchBar';
import { matchesBirdQuery } from '@/shared/lib/bird-search';

interface CollectionSearchProps {
  birds: Bird[];
  isAdmin: boolean;
  observedIds: number[];
  savedLocations: SavedLocation[];
  collectionDataByBirdId: Record<number, CollectionCardData>;
}

export default function CollectionSearch({
  birds,
  isAdmin,
  observedIds,
  savedLocations,
  collectionDataByBirdId,
}: CollectionSearchProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => birds.filter((b) => matchesBirdQuery(b, query)),
    [birds, query],
  );

  return (
    <>
      <BirdSearchBar
        query={query}
        onQueryChange={setQuery}
        placeholder='Search collection...'
        topOffsetClassName='top-[62px]'
      />

      <div className='max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)]'>
        <p className='mb-4 text-[10px] text-muted-foreground tracking-widest uppercase font-mono'>
          {birds.length === 0
            ? 'No birds observed yet'
            : filtered.length === birds.length
              ? `${birds.length} ${birds.length === 1 ? 'species' : 'species'} collected`
              : `${filtered.length} of ${birds.length} species`}
        </p>

        <BirdGrid
          birds={filtered}
          isAdmin={isAdmin}
          isAuthenticated
          observedIds={observedIds}
          savedLocations={savedLocations}
          collectionDataByBirdId={collectionDataByBirdId}
        />
      </div>
    </>
  );
}
