'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Bird, Biome, Food, Rarity } from '@/entities/bird-domain';
import { BIOMES, FOODS, RARITY_COLOR, biomeImage, biomeIcon, BIOME_FALLBACK_ICON, foodImage, foodIcon, FOOD_FALLBACK_ICON } from '@/entities/bird-domain';
import BirdGrid from '@/features/birds/components/BirdGrid/BirdGrid';
import type { SavedLocation } from '@/features/locations/location-queries';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal, X } from 'lucide-react';
import FilterRow from './FilterRow';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';

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
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  useEffect(() => {
    if (!filtersOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setFiltersOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [filtersOpen]);

  const visibleBirds = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasActiveFilters = selectedRarities.size > 0 || selectedBiomes.size > 0 || selectedFoods.size > 0;
  const activeCount = selectedRarities.size + selectedBiomes.size + selectedFoods.size;

  function handleReset() {
    setSelectedRarities(new Set());
    setSelectedBiomes(new Set());
    setSelectedFoods(new Set());
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className='flex-1 px-0 md:px-6 py-5 mt-[52px] md:mt-0'>
      {/* Search bar + filter button */}
      <div className='hidden md:flex items-center gap-2 mb-4'>
        <Input
          type='text'
          placeholder='Search birds...'
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
          className='bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/60 max-w-xs'
        />
        <button
          onClick={() => setFiltersOpen(true)}
          className={`relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium border transition-colors shrink-0 ${hasActiveFilters ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && (
            <span className='absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center'>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile top bar */}
      <div className='md:hidden fixed top-[62px] left-0 right-0 z-30 bg-card border-b border-border px-4 py-2 flex items-center gap-2'>
        <Input
          type='text'
          placeholder='Search birds...'
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
          className='bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/60 flex-1'
        />
        <button
          onClick={() => setFiltersOpen(true)}
          className={`relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium border transition-colors shrink-0 ${hasActiveFilters ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground'}`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && (
            <span className='absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center'>
              {activeCount}
            </span>
          )}
        </button>
      </div>

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

      {/* Filter modal */}
      {filtersOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='absolute inset-0 bg-black/50' onClick={() => setFiltersOpen(false)} />
          <div className='relative bg-card rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
              <span className='text-sm font-semibold tracking-wide'>Filters</span>
              <button onClick={() => setFiltersOpen(false)} className='p-1 text-muted-foreground hover:text-foreground'>
                <X size={18} />
              </button>
            </div>

            <div className='overflow-y-auto flex-1 px-5 py-4 space-y-6'>
              <FilterSection label='Rarity'>
                {RARITIES.map((r) => (
                  <FilterRow
                    key={r}
                    active={selectedRarities.has(r)}
                    onClick={() => { setSelectedRarities(toggle(selectedRarities, r)); setVisibleCount(PAGE_SIZE); }}
                    count={rarityCounts[r] ?? 0}
                    label={r}
                    icon={
                      <span
                        className='inline-block shrink-0'
                        style={{
                          width: 18,
                          height: 18,
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                          backgroundColor: RARITY_COLOR[r],
                        }}
                      />
                    }
                  />
                ))}
              </FilterSection>

              <FilterSection label='Biome'>
                {availableBiomes.map((b) => (
                  <FilterRow
                    key={b}
                    active={selectedBiomes.has(b)}
                    onClick={() => { setSelectedBiomes(toggle(selectedBiomes, b)); setVisibleCount(PAGE_SIZE); }}
                    count={biomeCounts[b] ?? 0}
                    label={b}
                    icon={
                      biomeImage[b]
                        ? <HexIcon imageSrc={biomeImage[b]} size={24} />
                        : <span className='text-base leading-none'>{biomeIcon[b] ?? BIOME_FALLBACK_ICON}</span>
                    }
                  />
                ))}
              </FilterSection>

              <FilterSection label='Food'>
                {availableFoods.map((f) => (
                  <FilterRow
                    key={f}
                    active={selectedFoods.has(f)}
                    onClick={() => { setSelectedFoods(toggle(selectedFoods, f)); setVisibleCount(PAGE_SIZE); }}
                    count={foodCounts[f] ?? 0}
                    label={f}
                    icon={
                      foodImage[f]
                        ? <HexIcon imageSrc={foodImage[f]} size={24} />
                        : <span className='text-base leading-none'>{foodIcon[f] ?? FOOD_FALLBACK_ICON}</span>
                    }
                  />
                ))}
              </FilterSection>
            </div>

            {hasActiveFilters && (
              <div className='px-5 py-4 border-t border-border'>
                <button
                  onClick={handleReset}
                  className='w-full rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground'
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className='mb-1.5 text-[9px] font-medium text-muted-foreground uppercase tracking-[0.2em] font-mono'>{label}</p>
      <div className='space-y-0.5'>{children}</div>
    </div>
  );
}
