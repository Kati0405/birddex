'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Bird, Search, X } from 'lucide-react';
import { RARITY_COLOR } from '@/entities/bird-domain';
import { getBirdsForSearch, type BirdSearchResult } from '@/features/birds/actions/bird-search';
import AddObservationModal from '@/features/observations/components/AddObservationModal/AddObservationModal';
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
  onClose: () => void;
}

export default function QuickAddObservationModal({ savedLocations = [], initialLocation, onClose }: Props) {
  const [birds, setBirds] = useState<BirdSearchResult[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<BirdSearchResult | null>(null);
  const [, startLoad] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startLoad(async () => {
      const list = await getBirdsForSearch();
      setBirds(list);
      // Preload the first 8 thumbnails immediately after the list arrives
      list.slice(0, 8).forEach((b) => {
        const src = b.selected_image?.thumbnailUrl ?? b.image_url;
        if (src) {
          const img = new Image();
          img.src = src;
        }
      });
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const filtered = query.trim().length === 0
    ? birds.slice(0, 8)
    : birds
        .filter(
          (b) =>
            b.name_eng.toLowerCase().includes(query.toLowerCase()) ||
            b.name_latin.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 8);

  if (selected) {
    const frameColor = RARITY_COLOR[selected.rarity as keyof typeof RARITY_COLOR] ?? RARITY_COLOR.Common;

    const locSavedLocations: SavedLocation[] = initialLocation
      ? [
          {
            id: initialLocation.savedLocationId,
            name: initialLocation.locationName,
            lat: initialLocation.lat,
            lng: initialLocation.lng,
            habitats: [],
            photoUrl: null,
            photoPublicId: null,
          } as SavedLocation,
          ...savedLocations.filter((l) => l.id !== initialLocation.savedLocationId),
        ]
      : savedLocations;

    return (
      <AddObservationModal
        birdId={selected.id}
        birdName={selected.name_eng}
        frameColor={frameColor}
        savedLocations={locSavedLocations}
        initialSelectedLocationId={initialLocation?.savedLocationId}
        onClose={onClose}
        onSaved={() => onClose()}
      />
    );
  }

  return createPortal(
    <div
      className='fixed inset-0 z-[110] flex items-start justify-center pt-[12vh] px-4'
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className='w-full max-w-sm rounded-xl overflow-hidden bg-card border border-border shadow-2xl flex flex-col'>
        {/* Header */}
        <div className='flex items-center gap-2 px-4 py-3 border-b border-border'>
          <Bird size={16} className='text-primary shrink-0' />
          <span className='text-sm font-semibold flex-1'>Log observation</span>
          <button
            type='button'
            onClick={onClose}
            aria-label='Close'
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className='px-4 pt-3 pb-2'>
          <p className='text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2'>
            Which bird did you see?
          </p>
          <div className='relative'>
            <Search size={13} className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60' />
            <input
              ref={inputRef}
              type='text'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search by name…'
              className='w-full pl-8 pr-3 py-2 text-sm rounded-md border border-border bg-background/60 text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors'
            />
          </div>
        </div>

        {/* Results */}
        <div className='max-h-[320px] overflow-y-auto pb-3'>
          {birds.length === 0 ? (
            <div className='flex justify-center py-8'>
              <div className='w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin' />
            </div>
          ) : filtered.length === 0 ? (
            <p className='text-center text-xs text-muted-foreground py-8'>No birds found</p>
          ) : (
            <div className='flex flex-col divide-y divide-border/50'>
              {filtered.map((bird) => {
                const color = RARITY_COLOR[bird.rarity as keyof typeof RARITY_COLOR] ?? RARITY_COLOR.Common;
                return (
                  <button
                    key={bird.id}
                    type='button'
                    onClick={() => setSelected(bird)}
                    className='flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors group'
                  >
                    <div
                      className='w-8 h-8 rounded-md overflow-hidden shrink-0 flex items-center justify-center'
                      style={{ background: `${color}18`, border: `1px solid ${color}40` }}
                    >
                      {(bird.selected_image?.thumbnailUrl ?? bird.image_url) ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={(bird.selected_image?.thumbnailUrl ?? bird.image_url)!} alt='' className='w-full h-full object-cover' loading='eager' decoding='async' />
                      ) : (
                        <Bird size={14} style={{ color }} />
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors'>
                        {bird.name_eng}
                      </p>
                      <p className='text-[10px] text-muted-foreground/60 truncate italic'>{bird.name_latin}</p>
                    </div>
                    <div
                      className='w-1.5 h-1.5 rounded-full shrink-0'
                      style={{ background: color }}
                      title={bird.rarity}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
