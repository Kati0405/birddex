'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PAGE_SIZE = 20;
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Bird, Biome, Food, Rarity } from '@/lib/types';
import { BIOMES, biomeImage, biomeIcon, BIOME_FALLBACK_ICON } from '@/lib/biome';
import { FOODS, foodImage, foodIcon, FOOD_FALLBACK_ICON } from '@/lib/food';
import { RARITY_COLOR } from '@/lib/rarity';
import BirdGrid from './BirdGrid';
import HexIcon from './HexIcon';

const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

export default function BirdSearch({ birds, isAdmin = false }: { birds: Bird[]; isAdmin?: boolean }) {
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

  // Counts from all birds (always shows full distribution)
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

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, selectedRarities, selectedBiomes, selectedFoods]);

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
  const hasMore = visibleCount < filtered.length;

  const hasActiveFilters = selectedRarities.size > 0 || selectedBiomes.size > 0 || selectedFoods.size > 0;

  return (
    <div className="flex min-h-[calc(100vh-160px)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-border flex flex-col" style={{ background: '#faf6ee' }}>
        <div className="flex-1 px-4 py-5 space-y-6">
          {/* Search */}
          <Input
            type="text"
            placeholder="Search birds..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/60"
          />

          {/* Filters heading */}
          <div>
            <p className="text-[9px] font-semibold tracking-[0.25em] text-muted-foreground uppercase mb-3" style={{ fontFamily: 'var(--font-dm-mono)' }}>
              Filters
            </p>

            {/* Rarity */}
            <FilterSection label="Rarity">
              {RARITIES.map((r) => {
                const active = selectedRarities.has(r);
                return (
                  <FilterRow
                    key={r}
                    active={active}
                    onClick={() => setSelectedRarities(toggle(selectedRarities, r))}
                    count={rarityCounts[r] ?? 0}
                    label={r}
                    icon={
                      <span
                        className="inline-block shrink-0"
                        style={{
                          width: 18,
                          height: 18,
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                          backgroundColor: RARITY_COLOR[r],
                        }}
                      />
                    }
                  />
                );
              })}
            </FilterSection>

            {/* Biome */}
            <FilterSection label="Biome">
              {availableBiomes.map((b) => {
                const active = selectedBiomes.has(b);
                return (
                  <FilterRow
                    key={b}
                    active={active}
                    onClick={() => setSelectedBiomes(toggle(selectedBiomes, b))}
                    count={biomeCounts[b] ?? 0}
                    label={b}
                    icon={
                      biomeImage[b]
                        ? <HexIcon imageSrc={biomeImage[b]} size={24} />
                        : <span className="text-base leading-none">{biomeIcon[b] ?? BIOME_FALLBACK_ICON}</span>
                    }
                  />
                );
              })}
            </FilterSection>

            {/* Food */}
            <FilterSection label="Food">
              {availableFoods.map((f) => {
                const active = selectedFoods.has(f);
                return (
                  <FilterRow
                    key={f}
                    active={active}
                    onClick={() => setSelectedFoods(toggle(selectedFoods, f))}
                    count={foodCounts[f] ?? 0}
                    label={f}
                    icon={
                      foodImage[f]
                        ? <HexIcon imageSrc={foodImage[f]} size={24} />
                        : <span className="text-base leading-none">{foodIcon[f] ?? FOOD_FALLBACK_ICON}</span>
                    }
                  />
                );
              })}
            </FilterSection>
          </div>
        </div>

        {/* Reset button — pinned to bottom */}
        {hasActiveFilters && (
          <div className="px-4 py-4 border-t border-border">
            <button
              onClick={() => {
                setSelectedRarities(new Set());
                setSelectedBiomes(new Set());
                setSelectedFoods(new Set());
              }}
              className="w-full rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              Reset Filters
            </button>
          </div>
        )}
      </aside>

      {/* Grid area */}
      <div className="flex-1 px-6 py-5">
        <p className="mb-4 text-[10px] text-muted-foreground tracking-widest uppercase" style={{ fontFamily: 'var(--font-dm-mono)' }}>
          {filtered.length} {filtered.length === 1 ? 'species' : 'species'} found
        </p>
        <BirdGrid birds={visibleBirds} isAdmin={isAdmin} />
        <div ref={sentinelRef} className="h-8" />
        {hasMore && (
          <p className="py-4 text-center text-[10px] text-muted-foreground tracking-widest uppercase" style={{ fontFamily: 'var(--font-dm-mono)' }}>
            Loading…
          </p>
        )}
      </div>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-1.5 text-[9px] font-medium text-muted-foreground uppercase tracking-[0.2em]" style={{ fontFamily: 'var(--font-dm-mono)' }}>{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FilterRow({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
        active
          ? 'bg-muted/60 text-foreground'
          : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground',
      )}
    >
      <span className="flex h-6 w-6 items-center justify-center shrink-0">{icon}</span>
      <span className="flex-1 capitalize">{label}</span>
      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </button>
  );
}
