import Image from 'next/image';
import { biomeImage, foodImage, behaviourImage } from '@/entities/bird-domain';
import type { Bird } from '@/entities/bird-domain';
import BirdImage from '@/features/birds/components/BirdImage/BirdImage';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import ObservationButton from '@/features/observations/components/ObservationButton/ObservationButton';
import type { SavedLocation } from '@/features/locations/location-queries';

interface Props {
  bird: Bird;
  frameColor: string;
  isAdmin: boolean;
  isObserved: boolean;
  isAuthenticated: boolean;
  savedLocations?: SavedLocation[];
}

export default function BirdCardFront({
  bird,
  frameColor,
  isAuthenticated,
  isObserved,
  savedLocations = [],
}: Props) {
  return (
    <div
      className='[grid-area:1/1] h-full [backface-visibility:hidden] rounded-xl flex flex-col overflow-hidden bg-card'
      style={{
        border: `2px solid ${frameColor}70`,
        boxShadow: `0 4px 20px ${frameColor}20`,
      }}
    >
      {/* Rarity colour band — top */}
      <div className='h-1 w-full shrink-0' style={{ background: frameColor }} />

      {/* Name row */}
      <div className='px-2 pt-2 pb-1 flex items-center gap-2'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1 mb-0.5'>
            <div
              className='w-[8px] h-[8px] shrink-0'
              style={{
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                background: frameColor,
              }}
            />
            <span
              className='text-[7px] uppercase tracking-[0.2em] font-mono'
              style={{ color: frameColor }}
            >
              {bird.rarity}
            </span>
          </div>
          <h2 className='text-sm font-semibold leading-tight truncate text-card-foreground'>
            {bird.name_eng}
          </h2>
          <p className='text-[10px] italic mt-0.5 truncate text-muted-foreground'>
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

      {/* Image — grows to absorb extra height from row equalisation */}
      <BirdImage
        imageUrl={bird.image_url}
        selectedImage={bird.selected_image}
        className='mx-1.5 rounded-md flex-1 min-h-[80px]'
      />

      {/* Icon row: food left, biomes right */}
      <div className='px-1.5 pt-1 pb-0.5 flex items-end justify-between min-w-0'>
        <div className='flex flex-col gap-0.5 min-w-0'>
          <p
            className='text-[7px] uppercase tracking-[0.18em] font-mono'
            style={{ color: 'rgba(120,95,60,0.5)' }}
          >
            Food
          </p>
          <div className='flex gap-0.5'>
            {bird.food.slice(0, 3).map((f) => (
              <HexIcon key={f} imageSrc={foodImage[f]} label={f} size={36} bgColor={`${frameColor}28`} />
            ))}
          </div>
        </div>
        <div className='flex flex-col items-end gap-0.5 min-w-0'>
          <p
            className='text-[7px] uppercase tracking-[0.18em] font-mono'
            style={{ color: 'rgba(120,95,60,0.5)' }}
          >
            Habitat
          </p>
          <div className='flex gap-0.5'>
            {bird.biomes.slice(0, 3).map((b) => (
              <HexIcon key={b} imageSrc={biomeImage[b]} label={b} size={36} bgColor={`${frameColor}28`} />
            ))}
          </div>
        </div>
      </div>

      {/* Field note */}
      <div className='relative mx-1.5 my-1'>
        <div
          className='relative rounded-sm px-4 py-2 overflow-hidden'
          style={{
            background: '#f7f1e6',
            border: '1px solid #e5dac8',
            backgroundImage:
              'radial-gradient(rgba(120,90,50,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4), rgba(0,0,0,.03))',
            backgroundSize: '6px 6px, 100% 100%',
          }}
        >
          <div className='absolute left-1.5 top-2 flex flex-col gap-1.5'>
            <span className='h-1.5 w-1.5 rounded-full bg-white border border-[#d8cbb8] block' />
            <span className='h-1.5 w-1.5 rounded-full bg-white border border-[#d8cbb8] block' />
          </div>

          <p
            className='relative pl-5 pr-3 line-clamp-2 leading-snug text-[13px]'
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
        <div className='px-2 pb-3 flex flex-col items-start gap-1'>
          <p
            className='text-[7px] uppercase tracking-[0.18em] font-mono'
            style={{ color: 'rgba(120,95,60,0.5)' }}
          >
            Behaviour
          </p>
          <div className='flex flex-wrap gap-1'>
            {bird.behaviour.map((b) => (
              <span
                key={b}
                title={b}
                className='text-[10px] px-2 py-0.5 rounded leading-none inline-flex items-center gap-1 text-muted-foreground'
                style={{
                  background: `${frameColor}18`,
                  border: `1px solid ${frameColor}45`,
                }}
              >
                {behaviourImage[b] && (
                  <Image
                    src={behaviourImage[b]}
                    alt={b}
                    width={11}
                    height={11}
                    className='opacity-70'
                  />
                )}
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
