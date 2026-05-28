import Image from 'next/image';
import Link from 'next/link';
import birdImg from '@/components/icons/ui/bird.png';
import type { Bird } from '@/entities/bird-domain';

interface Props {
  bird: Bird;
  frameColor: string;
  isAdmin: boolean;
  onFlip: () => void;
}

export default function BirdCardBack({ bird, frameColor, isAdmin, onFlip }: Props) {
  return (
    <div
      className='absolute inset-0 rounded-xl [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center gap-5 p-6 text-center overflow-hidden bg-card'
      style={{
        border: `2px solid ${frameColor}70`,
        boxShadow: `0 4px 20px ${frameColor}20`,
      }}
    >
      <div className='h-1 w-full absolute top-0 left-0' style={{ background: frameColor }} />

      <div>
        <p className='text-sm font-semibold text-card-foreground'>{bird.name_eng}</p>
        <p className='text-[10px] italic mt-0.5 text-muted-foreground'>{bird.name_latin}</p>
      </div>

      <p className='text-sm italic font-medium leading-relaxed text-muted-foreground'>
        &ldquo;{bird.field_note}&rdquo;
      </p>

      <div className='flex items-center gap-3'>
        <Link
          href={`/birds/${bird.id}`}
          onClick={(e) => e.stopPropagation()}
          className='text-[10px] underline underline-offset-4 transition-colors text-muted-foreground hover:text-foreground'
        >
          Full profile →
        </Link>
        {isAdmin && (
          <Link
            href={`/birds/${bird.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className='text-[10px] px-2.5 py-1 rounded border transition-colors text-muted-foreground hover:text-foreground'
            style={{ borderColor: `${frameColor}60`, background: `${frameColor}12` }}
          >
            Edit
          </Link>
        )}
      </div>

      {/* Flip back button */}
      <button
        onClick={(e) => { e.stopPropagation(); onFlip(); }}
        title='Flip back'
        aria-label='Flip back'
        className='absolute bottom-2 right-2 flex items-center justify-center rounded-full transition-all hover:opacity-80 active:scale-90'
        style={{ width: 22, height: 22, background: `${frameColor}18`, border: `1px solid ${frameColor}40` }}
      >
        <Image src={birdImg} alt='' width={12} height={12} className='opacity-55 scale-x-[-1]' />
      </button>
    </div>
  );
}
