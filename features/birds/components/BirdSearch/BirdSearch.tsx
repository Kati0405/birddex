'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Bird, Biome, Food, Rarity } from '@/entities/bird-domain';
import { BIOMES, FOODS, RARITY_COLOR, biomeImage, biomeIcon, BIOME_FALLBACK_ICON, foodImage, foodIcon, FOOD_FALLBACK_ICON } from '@/entities/bird-domain';
import BirdGrid from '@/features/birds/components/BirdGrid/BirdGrid';
import type { SavedLocation } from '@/features/locations/location-queries';
import type { CollectionCardData } from '@/features/observations/observation-queries';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal, X } from 'lucide-react';
import FilterRow from './FilterRow';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import { shuffle } from '@/shared/lib/shuffle';

const PAGE_SIZE = 20;
const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

type ObservationFilter = 'all' | 'observed' | 'unobserved';
type ObservationTypeFilter = Set<'seen' | 'heard' | 'photographed'>;

export default function BirdSearch({
  birds,
  isAdmin = false,
  isAuthenticated = false,
  observedIds = [],
  savedLocations = [],
  collectionDataByBirdId = {},
}: {
  birds: Bird[];
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  observedIds?: number[];
  savedLocations?: SavedLocation[];
  collectionDataByBirdId?: Record<number, CollectionCardData>;
}) {
  const [shuffledBirds, setShuffledBirds] = useState(birds);
  useEffect(() => {
    setShuffledBirds(shuffle(birds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [query, setQuery] = useState('');
  const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set());
  const [selectedBiomes, setSelectedBiomes] = useState<Set<Biome>>(new Set());
  const [selectedFoods, setSelectedFoods] = useState<Set<Food>>(new Set());
  const [observationFilter, setObservationFilter] = useState<ObservationFilter>('all');
  const [observationTypeFilter, setObservationTypeFilter] = useState<ObservationTypeFilter>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const observedSet = useMemo(() => new Set(observedIds), [observedIds]);

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
      shuffledBirds.filter((b) => {
        const matchesQuery =
          query === '' ||
          b.name_eng.toLowerCase().includes(query.toLowerCase()) ||
          b.name_latin.toLowerCase().includes(query.toLowerCase());
        const matchesRarity = selectedRarities.size === 0 || selectedRarities.has(b.rarity);
        const matchesBiome = selectedBiomes.size === 0 || b.biomes.some((bm) => selectedBiomes.has(bm));
        const matchesFood = selectedFoods.size === 0 || b.food.some((f) => selectedFoods.has(f));

        let matchesObservation = true;
        if (isAuthenticated) {
          const isObserved = observedSet.has(b.id);
          if (observationFilter === 'observed') matchesObservation = isObserved;
          else if (observationFilter === 'unobserved') matchesObservation = !isObserved;

          if (matchesObservation && observationTypeFilter.size > 0) {
            const data = collectionDataByBirdId[b.id];
            if (!data) {
              matchesObservation = false;
            } else {
              if (observationTypeFilter.has('seen') && data.seenCount === 0) matchesObservation = false;
              if (observationTypeFilter.has('heard') && data.heardCount === 0) matchesObservation = false;
              if (observationTypeFilter.has('photographed') && data.photographedCount === 0) matchesObservation = false;
            }
          }
        }

        return matchesQuery && matchesRarity && matchesBiome && matchesFood && matchesObservation;
      }),
    [shuffledBirds, query, selectedRarities, selectedBiomes, selectedFoods, observationFilter, observationTypeFilter, observedSet, collectionDataByBirdId, isAuthenticated],
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

  const baseActiveCount = selectedRarities.size + selectedBiomes.size + selectedFoods.size;
  const obsActiveCount = (observationFilter !== 'all' ? 1 : 0) + observationTypeFilter.size;
  const activeCount = baseActiveCount + obsActiveCount;
  const hasActiveFilters = activeCount > 0;

  function handleReset() {
    setSelectedRarities(new Set());
    setSelectedBiomes(new Set());
    setSelectedFoods(new Set());
    setObservationFilter('all');
    setObservationTypeFilter(new Set());
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className='mt-[52px] md:mt-0 py-5'>
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
          aria-label={hasActiveFilters ? `Filters, ${activeCount} active` : 'Filters'}
          className={`relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium border transition-colors shrink-0 ${hasActiveFilters ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground'}`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && (
            <span aria-hidden='true' className='absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center'>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Single content container */}
      <div className='max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)]'>
        {/* Search bar + filter button (desktop) */}
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
            aria-label={hasActiveFilters ? `Filters, ${activeCount} active` : 'Filters'}
            className={`relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium border transition-colors shrink-0 ${hasActiveFilters ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:bg-muted/40'}`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && (
              <span aria-hidden='true' className='absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center'>
                {activeCount}
              </span>
            )}
          </button>
        </div>

        <p className='mb-4 text-[10px] text-muted-foreground tracking-widest uppercase font-mono'>
          {filtered.length} species found
        </p>
        <BirdGrid
          birds={visibleBirds}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          observedIds={observedIds}
          savedLocations={savedLocations}
          collectionDataByBirdId={collectionDataByBirdId}
        />
        <div ref={sentinelRef} className='h-8' />
        {visibleCount < filtered.length && (
          <p className='py-4 text-center text-[10px] text-muted-foreground tracking-widest uppercase font-mono'>
            Loading…
          </p>
        )}
      </div>

      {/* Filter modal */}
      {filtersOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='absolute inset-0 bg-black/50' onClick={() => setFiltersOpen(false)} aria-hidden='true' />
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby='filters-dialog-title'
            className='relative bg-card rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col'
          >
            <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
              <span id='filters-dialog-title' className='text-sm font-semibold tracking-wide'>Filters</span>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label='Close filters'
                className='p-1 text-muted-foreground hover:text-foreground'
              >
                <X size={18} />
              </button>
            </div>

            <div className='overflow-y-auto flex-1 px-5 py-4 space-y-6'>
              {/* Observation filters — authenticated only */}
              {isAuthenticated && (
                <FilterSection label='My Collection'>
                  {(['all', 'observed', 'unobserved'] as ObservationFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setObservationFilter(f); setVisibleCount(PAGE_SIZE); }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${observationFilter === f ? 'bg-muted/60 text-foreground' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
                    >
                      <span className='flex h-6 w-6 items-center justify-center shrink-0 text-base'>
                        {f === 'all' ? '🐦' : f === 'observed' ? '✓' : '○'}
                      </span>
                      <span className='flex-1 capitalize'>{f === 'all' ? 'All birds' : f === 'observed' ? 'Observed' : 'Not yet observed'}</span>
                      {f === 'all' && <span className='text-xs tabular-nums text-muted-foreground'>{birds.length}</span>}
                      {f === 'observed' && <span className='text-xs tabular-nums text-muted-foreground'>{observedIds.length}</span>}
                      {f === 'unobserved' && <span className='text-xs tabular-nums text-muted-foreground'>{birds.length - observedIds.length}</span>}
                    </button>
                  ))}
                </FilterSection>
              )}

              {isAuthenticated && (
                <FilterSection label='Observed as'>
                  {(['seen', 'heard', 'photographed'] as const).map((t) => {
                    const count = Object.values(collectionDataByBirdId).filter((d) =>
                      t === 'seen' ? d.seenCount > 0 : t === 'heard' ? d.heardCount > 0 : d.photographedCount > 0
                    ).length;
                    const icon = t === 'seen' ? '👁' : t === 'heard' ? '👂' : '📷';
                    return (
                      <button
                        key={t}
                        onClick={() => { setObservationTypeFilter(toggle(observationTypeFilter, t)); setVisibleCount(PAGE_SIZE); }}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${observationTypeFilter.has(t) ? 'bg-muted/60 text-foreground' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
                      >
                        <span className='flex h-6 w-6 items-center justify-center shrink-0 text-base'>{icon}</span>
                        <span className='flex-1 capitalize'>{t}</span>
                        <span className='text-xs tabular-nums text-muted-foreground'>{count}</span>
                      </button>
                    );
                  })}
                </FilterSection>
              )}

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
