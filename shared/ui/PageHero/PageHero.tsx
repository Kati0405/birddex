import Image from 'next/image';
import { cn } from '@/shared/lib/cn';

type TextAlign = 'left' | 'center' | 'right';

interface Props {
  title: string;
  subtitle?: string;
  tagline?: string;
  action?: React.ReactNode;
  bgImage?: string;
  bgPosition?: string;
  birdImage?: string;
  textAlign?: TextAlign;
}

const GRADIENT_BY_ALIGN: Record<TextAlign, string> = {
  left: 'bg-gradient-to-r from-[#faf7f0]/80 via-[#faf7f0]/55 to-transparent',
  center:
    'bg-[radial-gradient(ellipse_at_center,#faf7f0_0%,#faf7f0cc_35%,transparent_75%)]',
  right: 'bg-gradient-to-l from-[#faf7f0]/80 via-[#faf7f0]/55 to-transparent',
};

const CONTENT_ALIGN: Record<TextAlign, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
};

export default function PageHero({
  title,
  subtitle,
  tagline,
  action,
  bgImage = '/hero/river_bg.png',
  bgPosition = '60% 85%',
  birdImage = '/hero/tit.png',
  textAlign = 'left',
}: Props) {
  return (
    <div className='relative isolate overflow-hidden rounded-2xl h-[180px] sm:h-[220px] lg:h-[260px]'>
      <Image
        src={bgImage}
        alt=''
        fill
        sizes='100vw'
        priority
        style={{ objectPosition: bgPosition }}
        className='object-cover pointer-events-none select-none'
        aria-hidden='true'
      />
      {birdImage && (
        <div className='absolute inset-y-0 right-0 w-[220px] sm:w-[280px] lg:w-[340px]'>
          <Image
            src={birdImage}
            alt=''
            fill
            sizes='340px'
            priority
            className='object-contain object-right pointer-events-none select-none'
            aria-hidden='true'
          />
        </div>
      )}
      <div className={cn('absolute inset-0', GRADIENT_BY_ALIGN[textAlign])} />

      <div className='relative z-10 h-full px-5 lg:px-16 sm:px-10 py-10 flex flex-col justify-between'>
        <div className={cn('flex flex-col', CONTENT_ALIGN[textAlign])}>
          <h1 className='font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground'>
            {title}
          </h1>
          {subtitle && (
            <p className='text-lg sm:text-base text-muted-foreground mt-1'>
              {subtitle}
            </p>
          )}
          {tagline && (
            <p className='text-xs text-muted-foreground mt-1'>{tagline}</p>
          )}
        </div>
        {action && <div className='self-end'>{action}</div>}
      </div>
    </div>
  );
}
