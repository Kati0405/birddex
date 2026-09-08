import Image from 'next/image';
import { biomeImage, foodImage } from '@/entities/bird-domain';
import type { Bird } from '@/entities/bird-domain';
import { RARITY_COLOR } from '@/entities/bird-domain';
import BirdImage from '@/features/birds/components/BirdImage/BirdImage';

interface Props {
  bird: Bird;
}

export default function BirdCardMini({ bird }: Props) {
  const frameColor = RARITY_COLOR[bird.rarity];
  const habitat = bird.biomes[0];
  const food = bird.food[0];

  return (
    <div
      className='aspect-[3/4.4] rounded-lg flex flex-col overflow-hidden bg-card'
      style={{
        border: `2px solid ${frameColor}70`,
        boxShadow: `0 4px 20px ${frameColor}20`,
      }}
    >
      {/* Rarity */}
      <div className='px-3 pt-1.5 pb-0.5 flex items-center gap-1 shrink-0'>
        <div
          className='w-[6px] h-[6px] shrink-0'
          style={{
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            background: frameColor,
          }}
        />
        <span
          className='text-[7px] uppercase tracking-[0.18em] font-mono'
          style={{ color: frameColor }}
        >
          {bird.rarity}
        </span>
      </div>

      {/* Names */}
      <div className='px-3 pb-1.5 shrink-0 min-h-[1.75rem]'>
        <h3 className='font-heading text-xs leading-tight text-card-foreground line-clamp-2 font-bold'>
          {bird.name_eng}
        </h3>
        <p className='text-[11px] italic truncate text-muted-foreground opacity-60'>
          {bird.name_latin}
        </p>
      </div>

      {/* Photo */}
      <BirdImage
        imageUrl={bird.image_url}
        selectedImage={bird.selected_image}
        className='mx-1 rounded flex-1 min-h-0'
      />

      {/* Habitat & food */}
      {(habitat || food) && (
        <div className='px-3 py-3 shrink-0 flex items-center justify-between gap-1'>
          {habitat ? (
            <div
              className='inline-flex items-center gap-1 min-w-0 rounded-md pl-1.5 pr-2 py-1'
              style={{ background: `${frameColor}18` }}
            >
              <Image
                src={biomeImage[habitat]}
                alt=''
                width={12}
                height={12}
                className='object-contain shrink-0'
              />
              <span className='text-[10px] text-card-foreground capitalize truncate'>
                {habitat}
              </span>
            </div>
          ) : (
            <span />
          )}
          {food && (
            <div
              className='inline-flex items-center gap-1 min-w-0 rounded-md pl-1.5 pr-2 py-1'
              style={{ background: `${frameColor}18` }}
            >
              <Image
                src={foodImage[food]}
                alt=''
                width={12}
                height={12}
                className='object-contain shrink-0'
              />
              <span className='text-[10px] text-card-foreground capitalize truncate'>
                {food}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
