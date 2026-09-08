import Link from 'next/link';
import Image from 'next/image';
import type { Bird } from '@/entities/bird-domain';
import { RARITY_COLOR } from '@/entities/bird-domain';
import BirdImage from '@/features/birds/components/BirdImage/BirdImage';
import SoundButton from '@/shared/ui/SoundButton/SoundButton';
import RarityBadge from '@/shared/ui/RarityBadge/RarityBadge';
import TipsToFind from '@/shared/ui/TipsToFind/TipsToFind';
import FieldMarks from '@/shared/ui/FieldMarks/FieldMarks';

export default function BirdSpotlight({ bird }: { bird: Bird }) {
  const frameColor = RARITY_COLOR[bird.rarity];

  return (
    <Link
      href={`/birds/${bird.id}`}
      className='relative h-full rounded-xl border border-border bg-card overflow-hidden flex flex-col no-underline group'
    >
      <Image
        src='/hero/robin-transparent.png'
        alt=''
        width={400}
        height={400}
        className='absolute -bottom-10 right-0 w-56 h-auto opacity-5 -scale-x-100 pointer-events-none select-none'
        aria-hidden='true'
      />

      <div className='relative flex items-center justify-between px-4 pt-3 pb-2'>
        <h2 className='font-heading text-sm font-bold text-card-foreground'>Bird of the day</h2>
        <RarityBadge rarity={bird.rarity} />
      </div>

      <div className='relative px-4 pb-3 flex-1 flex gap-3 min-h-0'>
        <div className='flex flex-col gap-2 w-2/5 shrink-0'>
          <div className='relative rounded-lg overflow-hidden aspect-square'>
            <BirdImage imageUrl={bird.image_url} selectedImage={bird.selected_image} className='w-full h-full' hideAttribution />
          </div>
          <div className='flex items-center justify-between gap-2 min-w-0'>
            <div className='min-w-0'>
              <h3 className='font-heading text-sm font-bold text-card-foreground truncate group-hover:text-primary transition-colors'>
                {bird.name_eng}
              </h3>
              <p className='text-[11px] italic text-muted-foreground truncate'>{bird.name_latin}</p>
            </div>
            <SoundButton soundUrl={bird.sound_url} />
          </div>
        </div>

        <div className='flex-1 min-w-0 overflow-auto flex flex-col gap-2.5'>
          {bird.field_marks?.length > 0 && (
            <div>
              <p className='text-[9px] uppercase tracking-[0.18em] font-mono mb-1' style={{ color: `${frameColor}bb` }}>
                Field Marks
              </p>
              <FieldMarks marks={bird.field_marks} />
            </div>
          )}
          {bird.tips_to_find?.length > 0 && (
            <div>
              <p className='text-[9px] uppercase tracking-[0.18em] font-mono mb-1' style={{ color: `${frameColor}bb` }}>
                How to Find
              </p>
              <TipsToFind tips={bird.tips_to_find} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
