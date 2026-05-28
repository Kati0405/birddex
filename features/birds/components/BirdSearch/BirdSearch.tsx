'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Bird, Biome, Food, Rarity } from '@/entities/bird-domain';
import { BIOMES, FOODS } from '@/entities/bird-domain';
import BirdGrid from '@/features/birds/components/BirdGrid/BirdGrid';
import BirdSearchSidebar from './BirdSearchSidebar';
import type { SavedLocation } from '@/features/locations/location-queries';

const PAGE_SIZE = 20;
const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

export default function BirdSearch({
  birds,
  isAdmin = false,
  isAuthenticated = false,
  observedIds = [],
  savedLocations = [],
}: {
  birds: Bird[];
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  observedIds?: number[];
  savedLocations?: SavedLocation[];
}) {
  const [query, setQuery] = useState('');
  const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set());
  const [selectedBiomes, setSelectedBiomes] = useState<Set<Biome>>(new Set());
  const [selectedFoods, setSelectedFoods] = useState<Set<Food>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const availableBiomes = useMemo(
    () => BIOMES.filter((b) => birds.some((bird) => bird.biomes.includes(b))),
    [birds],
  );
  const availableFoods = useMemo(
    () => FOODS.filter((f) => birds.some((bird) => bird.food.includes(f))),
    [birds],
  );

  const rarityCounts = useMemo(
    () => Object.fromEntries(RARITIES.map((r) => [r, birds.filter((b) => b.rarity === r).length])),
    [birds],
  );
  const biomeCounts = useMemo(
    () => Object.fromEntries(availableBiomes.map((b) => [b, birds.filter((bird) => bird.biomes.includes(b)).length])),
    [birds, availableBiomes],
  );
  const foodCounts = useMemo(
    () => Object.fromEntries(availableFoods.map((f) => [f, birds.filter((bird) => bird.food.includes(f)).length])),
    [birds, availableFoods],
  );

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  const filtered = useMemo(
    () =>
      birds.filter((b) => {
        const matchesQuery =
          query === '' ||
          b.name_eng.toLowerCase().includes(query.toLowerCase()) ||
          b.name_latin.toLowerCase().includes(query.toLowerCase());
        const matchesRarity = selectedRarities.size === 0 || selectedRarities.has(b.rarity);
        const matchesBiome = selectedBiomes.size === 0 || b.biomes.some((bm) => selectedBiomes.has(bm));
        const matchesFood = selectedFoods.size === 0 || b.food.some((f) => selectedFoods.has(f));
        return matchesQuery && matchesRarity && matchesBiome && matchesFood;
      }),
    [birds, query, selectedRarities, selectedBiomes, selectedFoods],
  );

  const loadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleBirds = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasActiveFilters = selectedRarities.size > 0 || selectedBiomes.size > 0 || selectedFoods.size > 0;

  function handleReset() {
    setSelectedRarities(new Set());
    setSelectedBiomes(new Set());
    setSelectedFoods(new Set());
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className='flex min-h-[calc(100vh-160px)]'>
      <BirdSearchSidebar
        query={query}
        onQueryChange={(q) => { setQuery(q); setVisibleCount(PAGE_SIZE); }}
        selectedRarities={selectedRarities}
        onToggleRarity={(r) => { setSelectedRarities(toggle(selectedRarities, r)); setVisibleCount(PAGE_SIZE); }}
        selectedBiomes={selectedBiomes}
        onToggleBiome={(b) => { setSelectedBiomes(toggle(selectedBiomes, b)); setVisibleCount(PAGE_SIZE); }}
        selectedFoods={selectedFoods}
        onToggleFood={(f) => { setSelectedFoods(toggle(selectedFoods, f)); setVisibleCount(PAGE_SIZE); }}
        availableBiomes={availableBiomes}
        availableFoods={availableFoods}
        rarityCounts={rarityCounts}
        biomeCounts={biomeCounts}
        foodCounts={foodCounts}
        hasActiveFilters={hasActiveFilters}
        onReset={handleReset}
      />

      <div className='flex-1 px-6 py-5'>
        <p className='mb-4 text-[10px] text-muted-foreground tracking-widest uppercase font-mono'>
          {filtered.length} {filtered.length === 1 ? 'species' : 'species'} found
        </p>
        <BirdGrid birds={visibleBirds} isAdmin={isAdmin} isAuthenticated={isAuthenticated} observedIds={observedIds} savedLocations={savedLocations} />
        <div ref={sentinelRef} className='h-8' />
        {visibleCount < filtered.length && (
          <p className='py-4 text-center text-[10px] text-muted-foreground tracking-widest uppercase font-mono'>
            Loading…
          </p>
        )}
      </div>
    </div>
  );
}
