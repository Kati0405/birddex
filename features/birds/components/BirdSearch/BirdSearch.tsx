'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Bird, Biome, Food, Rarity } from '@/entities/bird-domain';
import { BIOMES, FOODS } from '@/entities/bird-domain';
import BirdGrid from '@/features/birds/components/BirdGrid/BirdGrid';
import BirdSearchSidebar from './BirdSearchSidebar';
import type { SavedLocation } from '@/features/locations/location-queries';
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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

  const sidebarProps = {
    query,
    onQueryChange: (q: string) => { setQuery(q); setVisibleCount(PAGE_SIZE); },
    selectedRarities,
    onToggleRarity: (r: Rarity) => { setSelectedRarities(toggle(selectedRarities, r)); setVisibleCount(PAGE_SIZE); },
    selectedBiomes,
    onToggleBiome: (b: Biome) => { setSelectedBiomes(toggle(selectedBiomes, b)); setVisibleCount(PAGE_SIZE); },
    selectedFoods,
    onToggleFood: (f: Food) => { setSelectedFoods(toggle(selectedFoods, f)); setVisibleCount(PAGE_SIZE); },
    availableBiomes,
    availableFoods,
    rarityCounts,
    biomeCounts,
    foodCounts,
    hasActiveFilters,
    onReset: handleReset,
  };

  return (
    <div className='flex min-h-[calc(100vh-160px)]'>
      {/* Desktop sidebar */}
      <BirdSearchSidebar
        {...sidebarProps}
        className='hidden md:flex w-64 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-border flex-col bg-card'
      />

      {/* Mobile top bar — sits below the sticky app header (~62px) */}
      <div className='md:hidden fixed top-[62px] left-0 right-0 z-30 bg-card border-b border-border px-4 py-2 flex items-center gap-2'>
        <Input
          type='text'
          placeholder='Search birds...'
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
          className='bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/60 flex-1'
        />
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className='relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium border border-border bg-background text-foreground shrink-0'
        >
          <Filter size={15} />
          Filters
          {hasActiveFilters && (
            <span className='absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center'>
              {selectedRarities.size + selectedBiomes.size + selectedFoods.size}
            </span>
          )}
        </button>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className='md:hidden fixed inset-0 z-40 flex flex-col justify-end'>
          <div
            className='absolute inset-0 bg-black/50'
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className='relative bg-card rounded-t-2xl max-h-[80vh] flex flex-col'>
            <div className='flex items-center justify-between px-4 py-3 border-b border-border'>
              <span className='text-sm font-semibold'>Filters</span>
              <button onClick={() => setMobileFiltersOpen(false)} className='p-1 text-muted-foreground hover:text-foreground'>
                <X size={18} />
              </button>
            </div>
            <div className='overflow-y-auto flex-1'>
              <BirdSearchSidebar
                {...sidebarProps}
                className='flex flex-col bg-card'
                hideSearchInput
              />
            </div>
          </div>
        </div>
      )}

      <div className='flex-1 px-4 md:px-6 py-5 mt-[52px] md:mt-0'>
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
