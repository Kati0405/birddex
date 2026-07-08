import Image from 'next/image';
import { cn } from '@/shared/lib/cn';
import { biomeImage, foodImage, behaviourImage } from '@/entities/bird-domain';
import type { Bird, Biome, Food, Behaviour, Rarity } from '@/entities/bird-domain';
import BirdImage from '@/features/birds/components/BirdImage/BirdImage';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import ObservationButton from '@/features/observations/components/ObservationButton/ObservationButton';
import SoundButton from '@/shared/ui/SoundButton/SoundButton';
import BirdCardMenu from './BirdCardMenu';
import type { SavedLocation } from '@/features/locations/location-queries';

interface Props {
  bird: Bird;
  frameColor: string;
  isAdmin: boolean;
  isObserved: boolean;
  isAuthenticated: boolean;
  savedLocations?: SavedLocation[];
  onFlip?: () => void;
  active?: boolean;
  onToggleFood?: (food: Food) => void;
  onToggleBiome?: (biome: Biome) => void;
  onToggleBehaviour?: (behaviour: Behaviour) => void;
  onToggleRarity?: (rarity: Rarity) => void;
  selectedFoods?: Set<Food>;
  selectedBiomes?: Set<Biome>;
  selectedBehaviours?: Set<Behaviour>;
  selectedRarities?: Set<Rarity>;
}

export default function BirdCardFront({
  bird,
  frameColor,
  isAdmin,
  isAuthenticated,
  isObserved,
  savedLocations = [],
  onFlip,
  active = true,
  onToggleFood,
  onToggleBiome,
  onToggleBehaviour,
  onToggleRarity,
  selectedFoods,
  selectedBiomes,
  selectedBehaviours,
  selectedRarities,
}: Props) {
  const rarityActive = selectedRarities?.has(bird.rarity);
  const rarityClickable = !!onToggleRarity;
  const RarityTag = rarityClickable ? 'button' : 'div';
  return (
    <div
      className={cn(
        '[grid-area:1/1] h-full [backface-visibility:hidden] rounded-xl flex flex-col overflow-hidden bg-card',
        !active && 'pointer-events-none',
      )}
      style={{
        border: `2px solid ${frameColor}70`,
        boxShadow: `0 4px 20px ${frameColor}20`,
      }}
      onClick={onFlip}
    >
      {/* Rarity colour band — top */}
      <div className='h-1.5 sm:h-1 w-full shrink-0' style={{ background: frameColor }} />

      {/* Name row */}
      <div className='px-4 sm:px-2 pt-4 sm:pt-2 pb-2 sm:pb-1 flex items-center gap-2'>
        <div className='min-w-0 flex-1'>
          <RarityTag
            type={rarityClickable ? 'button' : undefined}
            aria-label={rarityClickable ? `Filter by ${bird.rarity}` : undefined}
            aria-pressed={rarityClickable ? rarityActive : undefined}
            onClick={
              rarityClickable
                ? (e: React.MouseEvent) => {
                    e.stopPropagation();
                    onToggleRarity(bird.rarity);
                  }
                : undefined
            }
            className={cn(
              'flex items-center gap-1.5 mb-1 sm:mb-0.5 rounded-sm -mx-1 px-1',
              rarityClickable && 'cursor-pointer transition-transform hover:scale-105 active:scale-95',
            )}
            style={{
              background: rarityActive ? `${frameColor}28` : 'transparent',
            }}
          >
            <div
              className='w-[12px] h-[12px] sm:w-[8px] sm:h-[8px] shrink-0'
              style={{
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                background: frameColor,
              }}
            />
            <span
              className='text-[11px] sm:text-[7px] uppercase tracking-[0.2em] font-mono'
              style={{ color: frameColor }}
            >
              {bird.rarity}
            </span>
          </RarityTag>
          <div className='flex items-center gap-1.5'>
            <h2 className='text-2xl sm:text-sm font-semibold leading-tight truncate text-card-foreground'>
              {bird.name_eng}
            </h2>
            <div className='shrink-0' onClick={(e) => e.stopPropagation()}>
              <SoundButton soundUrl={bird.sound_url} />
            </div>
            {isAdmin && <BirdCardMenu birdId={bird.id} birdName={bird.name_eng} />}
          </div>
          <p className='text-sm sm:text-[10px] italic mt-0.5 truncate text-muted-foreground'>
            {bird.name_latin}
          </p>
        </div>

        {/* Observation button */}
        <div className='shrink-0' onClick={(e) => e.stopPropagation()}>
          {isAuthenticated && (
            <ObservationButton
              birdId={bird.id}
              birdName={bird.name_eng}
              frameColor={frameColor}
              initialObserved={isObserved}
              savedLocations={savedLocations}
            />
          )}
        </div>
      </div>

      {/* Image */}
      <BirdImage
        imageUrl={bird.image_url}
        selectedImage={bird.selected_image}
        className='mx-2 sm:mx-1.5 rounded-md flex-1 min-h-[160px] max-h-[38vh] sm:max-h-none sm:min-h-[160px]'
      />

      {/* Icon row: food left, biomes right */}
      <div className='px-4 sm:px-1.5 pt-2 sm:pt-1 pb-2 sm:pb-1 flex items-end justify-between min-w-0'>
        <div className='flex flex-col gap-1 sm:gap-0.5 min-w-0'>
          <p
            className='text-[11px] sm:text-[7px] uppercase tracking-[0.18em] font-mono'
            style={{ color: 'rgba(120,95,60,0.5)' }}
          >
            Food
          </p>
          <div className='flex gap-1.5 sm:gap-1'>
            {bird.food.slice(0, 3).map((f) => (
              <HexIcon
                key={f}
                imageSrc={foodImage[f]}
                label={f}
                size={42}
                bgColor={`${frameColor}28`}
                onClick={onToggleFood ? () => onToggleFood(f) : undefined}
                active={selectedFoods?.has(f)}
              />
            ))}
          </div>
        </div>
        <div className='flex flex-col items-end gap-1 sm:gap-0.5 min-w-0'>
          <p
            className='text-[11px] sm:text-[7px] uppercase tracking-[0.18em] font-mono'
            style={{ color: 'rgba(120,95,60,0.5)' }}
          >
            Habitat
          </p>
          <div className='flex gap-1.5 sm:gap-1'>
            {bird.biomes.slice(0, 3).map((b) => (
              <HexIcon
                key={b}
                imageSrc={biomeImage[b]}
                label={b}
                size={42}
                bgColor={`${frameColor}28`}
                onClick={onToggleBiome ? () => onToggleBiome(b) : undefined}
                active={selectedBiomes?.has(b)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Field note */}
      <div className='relative mx-2 sm:mx-1.5 my-2 sm:my-1'>
        <div
          className='relative rounded-sm px-5 sm:px-4 py-3 sm:py-2 overflow-hidden'
          style={{
            background: '#f7f1e6',
            border: '1px solid #e5dac8',
            backgroundImage:
              'radial-gradient(rgba(120,90,50,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4), rgba(0,0,0,.03))',
            backgroundSize: '6px 6px, 100% 100%',
          }}
        >
          <div className='absolute left-2 top-3 sm:top-2 flex flex-col gap-2 sm:gap-1.5'>
            <span className='h-2 w-2 sm:h-1.5 sm:w-1.5 rounded-full bg-white border border-[#d8cbb8] block' />
            <span className='h-2 w-2 sm:h-1.5 sm:w-1.5 rounded-full bg-white border border-[#d8cbb8] block' />
          </div>

          <p
            className='relative pl-6 sm:pl-5 pr-3 line-clamp-2 leading-snug text-xl sm:text-[13px]'
            style={{
              fontFamily: 'var(--font-handwritten)',
              color: '#3a2e1e',
              letterSpacing: '0.01em',
            }}
          >
            {bird.field_note}
          </p>
        </div>
      </div>

      {/* Behaviour tags */}
      {bird.behaviour.length > 0 && (
        <div className='px-4 sm:px-2 pb-5 sm:pb-3 flex flex-col items-start gap-1.5 sm:gap-1'>
          <p
            className='text-[11px] sm:text-[7px] uppercase tracking-[0.18em] font-mono'
            style={{ color: 'rgba(120,95,60,0.5)' }}
          >
            Behaviour
          </p>
          <div className='flex flex-wrap gap-1.5 sm:gap-1'>
            {bird.behaviour.map((b) => {
              const active = selectedBehaviours?.has(b);
              const clickable = !!onToggleBehaviour;
              const Tag = clickable ? 'button' : 'span';
              return (
                <Tag
                  key={b}
                  type={clickable ? 'button' : undefined}
                  aria-label={clickable ? `Filter by ${b}` : undefined}
                  aria-pressed={clickable ? active : undefined}
                  onClick={
                    clickable
                      ? (e: React.MouseEvent) => {
                          e.stopPropagation();
                          onToggleBehaviour(b);
                        }
                      : undefined
                  }
                  className={cn(
                    'text-sm sm:text-[10px] px-3 sm:px-2 py-1.5 sm:py-0.5 rounded leading-none inline-flex items-center gap-1.5 sm:gap-1 text-muted-foreground',
                    clickable && 'cursor-pointer transition-transform hover:scale-105 active:scale-95',
                  )}
                  style={{
                    background: active ? `${frameColor}38` : `${frameColor}18`,
                    border: active ? `1px solid ${frameColor}` : `1px solid ${frameColor}45`,
                  }}
                >
                  {behaviourImage[b] && (
                    <Image
                      src={behaviourImage[b]}
                      alt={b}
                      width={14}
                      height={14}
                      className='opacity-70 sm:w-[11px] sm:h-[11px]'
                    />
                  )}
                  {b}
                </Tag>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
