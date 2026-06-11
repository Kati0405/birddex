'use client';

import { useState, useMemo } from 'react';
import type { Bird } from '@/entities/bird-domain';
import type { SavedLocation } from '@/features/locations/location-queries';
import type { CollectionCardData } from '@/features/observations/observation-queries';
import BirdGrid from '@/features/birds/components/BirdGrid/BirdGrid';
import { Input } from '@/components/ui/input';

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
    () =>
      query === ''
        ? birds
        : birds.filter(
            (b) =>
              b.name_eng.toLowerCase().includes(query.toLowerCase()) ||
              b.name_latin.toLowerCase().includes(query.toLowerCase()),
          ),
    [birds, query],
  );

  return (
    <>
      {/* Mobile fixed search bar */}
      <div className='md:hidden fixed top-[62px] left-0 right-0 z-30 bg-card border-b border-border px-4 py-2'>
        <Input
          type='text'
          placeholder='Search collection...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className='bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/60 w-full'
        />
      </div>

      <div className='max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)]'>
        {/* Desktop search bar */}
        <div className='hidden md:flex items-center gap-2 mb-4'>
          <Input
            type='text'
            placeholder='Search collection...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/60 max-w-xs'
          />
        </div>

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
