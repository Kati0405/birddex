'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import type {
  Bird,
  Biome,
  Behaviour,
  Food,
  Rarity,
} from '@/entities/bird-domain';
import {
  BIOMES,
  BEHAVIOURS,
  FOODS,
  RARITY_COLOR,
  biomeImage,
  biomeIcon,
  BIOME_FALLBACK_ICON,
  behaviourImage,
  foodImage,
  foodIcon,
  FOOD_FALLBACK_ICON,
} from '@/entities/bird-domain';
import BirdGrid from '@/features/birds/components/BirdGrid/BirdGrid';
import BirdSearchBar from '@/features/birds/components/BirdSearchBar/BirdSearchBar';
import type { SavedLocation } from '@/features/locations/location-queries';
import type { CollectionCardData } from '@/features/observations/observation-queries';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FilterRow from './FilterRow';
import ObservationStatusSwitcher from './ObservationStatusSwitcher';
import FilterChips, { type FilterChip } from './FilterChips';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import { shuffle } from '@/shared/lib/shuffle';
import { matchesBirdQuery } from '@/shared/lib/bird-search';
import { toggleInSet } from '@/shared/lib/toggle';

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
  const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(
    new Set(),
  );
  const [selectedBiomes, setSelectedBiomes] = useState<Set<Biome>>(new Set());
  const [selectedBehaviours, setSelectedBehaviours] = useState<Set<Behaviour>>(
    new Set(),
  );
  const [selectedFoods, setSelectedFoods] = useState<Set<Food>>(new Set());
  const [observationFilter, setObservationFilter] =
    useState<ObservationFilter>('all');
  const [observationTypeFilter, setObservationTypeFilter] =
    useState<ObservationTypeFilter>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const observedSet = useMemo(() => new Set(observedIds), [observedIds]);

  const availableBiomes = useMemo(
    () => BIOMES.filter((b) => birds.some((bird) => bird.biomes.includes(b))),
    [birds],
  );
  const availableBehaviours = useMemo(
    () =>
      BEHAVIOURS.filter((b) =>
        birds.some((bird) => bird.behaviour.includes(b)),
      ),
    [birds],
  );
  const availableFoods = useMemo(
    () => FOODS.filter((f) => birds.some((bird) => bird.food.includes(f))),
    [birds],
  );

  // Base predicates shared by every facet's "all other active filters" check
  const matchesQueryBase = useCallback(
    (b: Bird) => matchesBirdQuery(b, query),
    [query],
  );
  const matchesObservationBase = useCallback(
    (b: Bird) => {
      if (!isAuthenticated) return true;
      const isObserved = observedSet.has(b.id);
      if (observationFilter === 'observed' && !isObserved) return false;
      if (observationFilter === 'unobserved' && isObserved) return false;
      if (observationTypeFilter.size > 0) {
        const data = collectionDataByBirdId[b.id];
        if (!data) return false;
        if (observationTypeFilter.has('seen') && data.seenCount === 0)
          return false;
        if (observationTypeFilter.has('heard') && data.heardCount === 0)
          return false;
        if (
          observationTypeFilter.has('photographed') &&
          data.photographedCount === 0
        )
          return false;
      }
      return true;
    },
    [
      isAuthenticated,
      observedSet,
      observationFilter,
      observationTypeFilter,
      collectionDataByBirdId,
    ],
  );

  // Each facet's counts are computed against birds matching every OTHER active filter,
  // so picking e.g. "Legendary" narrows what Food/Biome/Behaviour options are actually available.
  const rarityCounts = useMemo(() => {
    const pool = birds.filter(
      (b) =>
        matchesQueryBase(b) &&
        matchesObservationBase(b) &&
        (selectedBiomes.size === 0 ||
          b.biomes.some((bm) => selectedBiomes.has(bm))) &&
        (selectedBehaviours.size === 0 ||
          b.behaviour.some((bh) => selectedBehaviours.has(bh))) &&
        (selectedFoods.size === 0 || b.food.some((f) => selectedFoods.has(f))),
    );
    return Object.fromEntries(
      RARITIES.map((r) => [r, pool.filter((b) => b.rarity === r).length]),
    );
  }, [
    birds,
    matchesQueryBase,
    matchesObservationBase,
    selectedBiomes,
    selectedBehaviours,
    selectedFoods,
  ]);

  const biomeCounts = useMemo(() => {
    const pool = birds.filter(
      (b) =>
        matchesQueryBase(b) &&
        matchesObservationBase(b) &&
        (selectedRarities.size === 0 || selectedRarities.has(b.rarity)) &&
        (selectedBehaviours.size === 0 ||
          b.behaviour.some((bh) => selectedBehaviours.has(bh))) &&
        (selectedFoods.size === 0 || b.food.some((f) => selectedFoods.has(f))),
    );
    return Object.fromEntries(
      availableBiomes.map((b) => [
        b,
        pool.filter((bird) => bird.biomes.includes(b)).length,
      ]),
    );
  }, [
    birds,
    availableBiomes,
    matchesQueryBase,
    matchesObservationBase,
    selectedRarities,
    selectedBehaviours,
    selectedFoods,
  ]);

  const behaviourCounts = useMemo(() => {
    const pool = birds.filter(
      (b) =>
        matchesQueryBase(b) &&
        matchesObservationBase(b) &&
        (selectedRarities.size === 0 || selectedRarities.has(b.rarity)) &&
        (selectedBiomes.size === 0 ||
          b.biomes.some((bm) => selectedBiomes.has(bm))) &&
        (selectedFoods.size === 0 || b.food.some((f) => selectedFoods.has(f))),
    );
    return Object.fromEntries(
      availableBehaviours.map((b) => [
        b,
        pool.filter((bird) => bird.behaviour.includes(b)).length,
      ]),
    );
  }, [
    birds,
    availableBehaviours,
    matchesQueryBase,
    matchesObservationBase,
    selectedRarities,
    selectedBiomes,
    selectedFoods,
  ]);

  const foodCounts = useMemo(() => {
    const pool = birds.filter(
      (b) =>
        matchesQueryBase(b) &&
        matchesObservationBase(b) &&
        (selectedRarities.size === 0 || selectedRarities.has(b.rarity)) &&
        (selectedBiomes.size === 0 ||
          b.biomes.some((bm) => selectedBiomes.has(bm))) &&
        (selectedBehaviours.size === 0 ||
          b.behaviour.some((bh) => selectedBehaviours.has(bh))),
    );
    return Object.fromEntries(
      availableFoods.map((f) => [
        f,
        pool.filter((bird) => bird.food.includes(f)).length,
      ]),
    );
  }, [
    birds,
    availableFoods,
    matchesQueryBase,
    matchesObservationBase,
    selectedRarities,
    selectedBiomes,
    selectedBehaviours,
  ]);

  const filtered = useMemo(
    () =>
      shuffledBirds.filter((b) => {
        const matchesQuery = matchesBirdQuery(b, query);
        const matchesRarity =
          selectedRarities.size === 0 || selectedRarities.has(b.rarity);
        const matchesBiome =
          selectedBiomes.size === 0 ||
          b.biomes.some((bm) => selectedBiomes.has(bm));
        const matchesBehaviour =
          selectedBehaviours.size === 0 ||
          b.behaviour.some((bh) => selectedBehaviours.has(bh));
        const matchesFood =
          selectedFoods.size === 0 || b.food.some((f) => selectedFoods.has(f));

        let matchesObservation = true;
        if (isAuthenticated) {
          const isObserved = observedSet.has(b.id);
          if (observationFilter === 'observed') matchesObservation = isObserved;
          else if (observationFilter === 'unobserved')
            matchesObservation = !isObserved;

          if (matchesObservation && observationTypeFilter.size > 0) {
            const data = collectionDataByBirdId[b.id];
            if (!data) {
              matchesObservation = false;
            } else {
              if (observationTypeFilter.has('seen') && data.seenCount === 0)
                matchesObservation = false;
              if (observationTypeFilter.has('heard') && data.heardCount === 0)
                matchesObservation = false;
              if (
                observationTypeFilter.has('photographed') &&
                data.photographedCount === 0
              )
                matchesObservation = false;
            }
          }
        }

        return (
          matchesQuery &&
          matchesRarity &&
          matchesBiome &&
          matchesBehaviour &&
          matchesFood &&
          matchesObservation
        );
      }),
    [
      shuffledBirds,
      query,
      selectedRarities,
      selectedBiomes,
      selectedBehaviours,
      selectedFoods,
      observationFilter,
      observationTypeFilter,
      observedSet,
      collectionDataByBirdId,
      isAuthenticated,
    ],
  );

  const loadMore = useCallback(() => {
    setVisibleCount((n) => Math.min(n + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    if (!filtersOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFiltersOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [filtersOpen]);

  const visibleBirds = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const baseActiveCount =
    selectedRarities.size +
    selectedBiomes.size +
    selectedBehaviours.size +
    selectedFoods.size;
  const obsActiveCount =
    (observationFilter !== 'all' ? 1 : 0) + observationTypeFilter.size;
  const activeCount = baseActiveCount + obsActiveCount;
  const hasActiveFilters = activeCount > 0;

  function handleReset() {
    setSelectedRarities(new Set());
    setSelectedBiomes(new Set());
    setSelectedBehaviours(new Set());
    setSelectedFoods(new Set());
    setObservationFilter('all');
    setObservationTypeFilter(new Set());
    setVisibleCount(PAGE_SIZE);
  }

  function removeFromSet<T>(
    setter: (updater: (s: Set<T>) => Set<T>) => void,
    value: T,
  ) {
    setter((s) => {
      const next = new Set(s);
      next.delete(value);
      return next;
    });
    setVisibleCount(PAGE_SIZE);
  }

  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    selectedRarities.forEach((r) =>
      chips.push({
        key: `rarity-${r}`,
        label: r,
        onRemove: () => removeFromSet(setSelectedRarities, r),
      }),
    );
    selectedBiomes.forEach((b) =>
      chips.push({
        key: `biome-${b}`,
        label: b,
        onRemove: () => removeFromSet(setSelectedBiomes, b),
      }),
    );
    selectedBehaviours.forEach((b) =>
      chips.push({
        key: `behaviour-${b}`,
        label: b,
        onRemove: () => removeFromSet(setSelectedBehaviours, b),
      }),
    );
    selectedFoods.forEach((f) =>
      chips.push({
        key: `food-${f}`,
        label: f,
        onRemove: () => removeFromSet(setSelectedFoods, f),
      }),
    );
    observationTypeFilter.forEach((t) =>
      chips.push({
        key: `obstype-${t}`,
        label: t,
        onRemove: () => removeFromSet(setObservationTypeFilter, t),
      }),
    );
    return chips;
  }, [
    selectedRarities,
    selectedBiomes,
    selectedBehaviours,
    selectedFoods,
    observationTypeFilter,
  ]);

  const filtersButton = (
    <button
      onClick={() => setFiltersOpen(true)}
      aria-label={
        hasActiveFilters ? `Filters, ${activeCount} active` : 'Filters'
      }
      className={cn(
        'relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium border transition-colors shrink-0',
        hasActiveFilters
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-background text-foreground hover:bg-muted/40',
      )}
    >
      <SlidersHorizontal size={15} />
      Filters
      {hasActiveFilters && (
        <span className='ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground'>
          {activeCount}
        </span>
      )}
    </button>
  );

  const resetButton = hasActiveFilters && (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      onClick={handleReset}
      aria-label='Reset filters'
      className='gap-1 text-muted-foreground hover:text-foreground'
    >
      <RotateCcw size={13} />
      <span className='hidden sm:inline'>Reset</span>
    </Button>
  );

  return (
    <div
      className={cn(
        isAuthenticated ? 'mt-[104px]' : 'mt-[56px]',
        'md:mt-0 py-5',
      )}
    >
      <BirdSearchBar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setVisibleCount(PAGE_SIZE);
        }}
        placeholder='Search birds...'
        topOffsetClassName='top-[62px]'
        desktopToolbarStyle
        mobileExtraControls={
          <>
            {filtersButton}
            {resetButton}
          </>
        }
        mobileExtraRow={
          isAuthenticated && (
            <ObservationStatusSwitcher
              value={observationFilter}
              onChange={(f) => {
                setObservationFilter(f);
                setVisibleCount(PAGE_SIZE);
              }}
              className='w-full [&>button]:flex-1'
            />
          )
        }
        desktopExtraControls={
          <>
            {filtersButton}
            {resetButton}
            {isAuthenticated && (
              <ObservationStatusSwitcher
                value={observationFilter}
                onChange={(f) => {
                  setObservationFilter(f);
                  setVisibleCount(PAGE_SIZE);
                }}
                className='ml-auto'
              />
            )}
          </>
        }
        desktopExtraRow={
          filterChips.length > 0 && (
            <div className='pt-2.5 border-t border-border'>
              <FilterChips chips={filterChips} />
            </div>
          )
        }
      />

      {/* Single content container */}
      <div className='max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)]'>
        {/* Mobile chips row */}
        {filterChips.length > 0 && (
          <div className='md:hidden mb-3'>
            <FilterChips chips={filterChips} />
          </div>
        )}

        <p className='mb-4 text-sm text-muted-foreground'>
          Showing {filtered.length}{' '}
          {filtered.length === 1 ? 'species' : 'species'}
        </p>
        <BirdGrid
          birds={visibleBirds}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          observedIds={observedIds}
          savedLocations={savedLocations}
          collectionDataByBirdId={collectionDataByBirdId}
          onToggleFood={(f) => {
            setSelectedFoods((s) => toggleInSet(s, f));
            setVisibleCount(PAGE_SIZE);
          }}
          onToggleBiome={(b) => {
            setSelectedBiomes((s) => toggleInSet(s, b));
            setVisibleCount(PAGE_SIZE);
          }}
          onToggleBehaviour={(b) => {
            setSelectedBehaviours((s) => toggleInSet(s, b));
            setVisibleCount(PAGE_SIZE);
          }}
          onToggleRarity={(r) => {
            setSelectedRarities((s) => toggleInSet(s, r));
            setVisibleCount(PAGE_SIZE);
          }}
          selectedFoods={selectedFoods}
          selectedBiomes={selectedBiomes}
          selectedBehaviours={selectedBehaviours}
          selectedRarities={selectedRarities}
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
          <div
            className='absolute inset-0 bg-black/50'
            onClick={() => setFiltersOpen(false)}
            aria-hidden='true'
          />
          <div
            role='dialog'
            aria-modal='true'
            aria-labelledby='filters-dialog-title'
            className='relative bg-card rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col'
          >
            <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
              <span
                id='filters-dialog-title'
                className='text-sm font-semibold tracking-wide'
              >
                Filters
              </span>
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
                  {(
                    ['all', 'observed', 'unobserved'] as ObservationFilter[]
                  ).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setObservationFilter(f);
                        setVisibleCount(PAGE_SIZE);
                      }}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${observationFilter === f ? 'bg-muted/60 text-foreground' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
                    >
                      <span className='flex h-6 w-6 items-center justify-center shrink-0 text-base'>
                        {f === 'all' ? '🐦' : f === 'observed' ? '✓' : '○'}
                      </span>
                      <span className='flex-1 capitalize'>
                        {f === 'all'
                          ? 'All birds'
                          : f === 'observed'
                            ? 'Observed'
                            : 'Not yet observed'}
                      </span>
                      {f === 'all' && (
                        <span className='text-xs tabular-nums text-muted-foreground'>
                          {birds.length}
                        </span>
                      )}
                      {f === 'observed' && (
                        <span className='text-xs tabular-nums text-muted-foreground'>
                          {observedIds.length}
                        </span>
                      )}
                      {f === 'unobserved' && (
                        <span className='text-xs tabular-nums text-muted-foreground'>
                          {birds.length - observedIds.length}
                        </span>
                      )}
                    </button>
                  ))}
                </FilterSection>
              )}

              {isAuthenticated && (
                <FilterSection label='Observed as'>
                  {(['seen', 'heard', 'photographed'] as const).map((t) => {
                    const count = Object.values(collectionDataByBirdId).filter(
                      (d) =>
                        t === 'seen'
                          ? d.seenCount > 0
                          : t === 'heard'
                            ? d.heardCount > 0
                            : d.photographedCount > 0,
                    ).length;
                    const icon =
                      t === 'seen' ? '👁' : t === 'heard' ? '👂' : '📷';
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          setObservationTypeFilter(
                            toggleInSet(observationTypeFilter, t),
                          );
                          setVisibleCount(PAGE_SIZE);
                        }}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${observationTypeFilter.has(t) ? 'bg-muted/60 text-foreground' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'}`}
                      >
                        <span className='flex h-6 w-6 items-center justify-center shrink-0 text-base'>
                          {icon}
                        </span>
                        <span className='flex-1 capitalize'>{t}</span>
                        <span className='text-xs tabular-nums text-muted-foreground'>
                          {count}
                        </span>
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
                    onClick={() => {
                      setSelectedRarities(toggleInSet(selectedRarities, r));
                      setVisibleCount(PAGE_SIZE);
                    }}
                    count={rarityCounts[r] ?? 0}
                    label={r}
                    icon={
                      <span
                        className='inline-block shrink-0'
                        style={{
                          width: 18,
                          height: 18,
                          clipPath:
                            'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
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
                    onClick={() => {
                      setSelectedBiomes(toggleInSet(selectedBiomes, b));
                      setVisibleCount(PAGE_SIZE);
                    }}
                    count={biomeCounts[b] ?? 0}
                    label={b}
                    icon={
                      biomeImage[b] ? (
                        <HexIcon imageSrc={biomeImage[b]} size={24} />
                      ) : (
                        <span className='text-base leading-none'>
                          {biomeIcon[b] ?? BIOME_FALLBACK_ICON}
                        </span>
                      )
                    }
                  />
                ))}
              </FilterSection>

              <FilterSection label='Behaviour'>
                {availableBehaviours.map((b) => (
                  <FilterRow
                    key={b}
                    active={selectedBehaviours.has(b)}
                    onClick={() => {
                      setSelectedBehaviours(toggleInSet(selectedBehaviours, b));
                      setVisibleCount(PAGE_SIZE);
                    }}
                    count={behaviourCounts[b] ?? 0}
                    label={b}
                    icon={<HexIcon imageSrc={behaviourImage[b]} size={24} />}
                  />
                ))}
              </FilterSection>

              <FilterSection label='Food'>
                {availableFoods.map((f) => (
                  <FilterRow
                    key={f}
                    active={selectedFoods.has(f)}
                    onClick={() => {
                      setSelectedFoods(toggleInSet(selectedFoods, f));
                      setVisibleCount(PAGE_SIZE);
                    }}
                    count={foodCounts[f] ?? 0}
                    label={f}
                    icon={
                      foodImage[f] ? (
                        <HexIcon imageSrc={foodImage[f]} size={24} />
                      ) : (
                        <span className='text-base leading-none'>
                          {foodIcon[f] ?? FOOD_FALLBACK_ICON}
                        </span>
                      )
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

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className='mb-1.5 text-[9px] font-medium text-muted-foreground uppercase tracking-[0.2em] font-mono'>
        {label}
      </p>
      <div className='space-y-0.5'>{children}</div>
    </div>
  );
}
