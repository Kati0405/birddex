import type { Biome, Food, Rarity } from '@/entities/bird-domain';
import { biomeImage, biomeIcon, BIOME_FALLBACK_ICON } from '@/entities/bird-domain';
import { foodImage, foodIcon, FOOD_FALLBACK_ICON } from '@/entities/bird-domain';
import { RARITY_COLOR } from '@/entities/bird-domain';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import { Input } from '@/components/ui/input';
import FilterRow from './FilterRow';

const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  selectedRarities: Set<Rarity>;
  onToggleRarity: (r: Rarity) => void;
  selectedBiomes: Set<Biome>;
  onToggleBiome: (b: Biome) => void;
  selectedFoods: Set<Food>;
  onToggleFood: (f: Food) => void;
  availableBiomes: Biome[];
  availableFoods: Food[];
  rarityCounts: Record<string, number>;
  biomeCounts: Record<string, number>;
  foodCounts: Record<string, number>;
  hasActiveFilters: boolean;
  onReset: () => void;
}

export default function BirdSearchSidebar({
  query,
  onQueryChange,
  selectedRarities,
  onToggleRarity,
  selectedBiomes,
  onToggleBiome,
  selectedFoods,
  onToggleFood,
  availableBiomes,
  availableFoods,
  rarityCounts,
  biomeCounts,
  foodCounts,
  hasActiveFilters,
  onReset,
}: Props) {
  return (
    <aside className='w-64 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-border flex flex-col bg-card'>
      <div className='flex-1 px-4 py-5 space-y-6'>
        <Input
          type='text'
          placeholder='Search birds...'
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className='bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/60'
        />

        <div>
          <p className='text-[9px] font-semibold tracking-[0.25em] text-muted-foreground uppercase mb-3 font-mono'>
            Filters
          </p>

          <FilterSection label='Rarity'>
            {RARITIES.map((r) => (
              <FilterRow
                key={r}
                active={selectedRarities.has(r)}
                onClick={() => onToggleRarity(r)}
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
                onClick={() => onToggleBiome(b)}
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
                onClick={() => onToggleFood(f)}
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
      </div>

      {hasActiveFilters && (
        <div className='px-4 py-4 border-t border-border'>
          <button
            onClick={onReset}
            className='w-full rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground'
          >
            Reset Filters
          </button>
        </div>
      )}
    </aside>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='mb-5'>
      <p className='mb-1.5 text-[9px] font-medium text-muted-foreground uppercase tracking-[0.2em] font-mono'>{label}</p>
      <div className='space-y-0.5'>{children}</div>
    </div>
  );
}
