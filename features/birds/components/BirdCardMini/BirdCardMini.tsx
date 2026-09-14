import Image from 'next/image';
import { biomeImage, foodImage } from '@/entities/bird-domain';
import type { Bird } from '@/entities/bird-domain';
import { RARITY_COLOR } from '@/entities/bird-domain';
import BirdImage from '@/features/birds/components/BirdImage/BirdImage';

interface Props {
  bird: Bird;
  hideAttribution?: boolean;
}

export default function BirdCardMini({ bird, hideAttribution }: Props) {
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

      {/* Name */}
      <div className='px-3 pb-1.5 shrink-0'>
        <h3 className='font-heading text-[11px] leading-tight text-card-foreground line-clamp-2 font-bold'>
          {bird.name_eng}
        </h3>
      </div>

      {/* Photo */}
      <BirdImage
        imageUrl={bird.image_url}
        selectedImage={bird.selected_image}
        className='mx-1 rounded flex-1 min-h-0'
        hideAttribution={hideAttribution}
      />

      {/* Food & habitat */}
      {(habitat || food) && (
        <div className='px-3 py-1.5 shrink-0 flex items-center justify-between gap-1'>
          {food ? (
            <div
              className='inline-flex items-center justify-center w-5 h-5'
              style={{
                background: `${frameColor}18`,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
              title={`Food: ${food}`}
            >
              <Image
                src={foodImage[food]}
                alt={`Food: ${food}`}
                width={10}
                height={10}
                className='object-contain shrink-0'
              />
            </div>
          ) : (
            <span />
          )}
          {habitat && (
            <div
              className='inline-flex items-center justify-center w-5 h-5'
              style={{
                background: `${frameColor}18`,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
              title={`Habitat: ${habitat}`}
            >
              <Image
                src={biomeImage[habitat]}
                alt={`Habitat: ${habitat}`}
                width={10}
                height={10}
                className='object-contain shrink-0'
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
