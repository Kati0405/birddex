import React from 'react';
import Image from 'next/image';
import { cn } from '@/shared/lib/cn';
import defaultBirdImg from '@/components/icons/ui/bird.png';
import type { WikimediaImage } from '@/entities/bird-domain';

interface Props {
  imageUrl?: string;
  selectedImage?: WikimediaImage;
  className?: string;
  fadeColor?: string;
  style?: React.CSSProperties;
}

export default function BirdImage({
  imageUrl,
  selectedImage,
  className,
  fadeColor = '#e8dfc8',
  style,
}: Props) {
  const src = selectedImage?.imageUrl ?? imageUrl ?? null;

  return (
    <div
      className={cn(
        'w-full relative overflow-hidden flex items-center justify-center',
        className,
      )}
      style={{ background: '#ddd0ae', ...style }}
    >
      {src ? (
        <Image
          src={src}
          alt=''
          fill
          unoptimized
          className='object-cover object-center'
          sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
        />
      ) : (
        <Image
          src={defaultBirdImg}
          alt='Bird silhouette'
          fill
          className='object-contain object-center opacity-30 p-6'
        />
      )}

      <div
        className='absolute bottom-0 left-0 right-0 h-2/5 z-10'
        style={{
          background: `linear-gradient(to top, ${fadeColor} 0%, transparent 50%)`,
        }}
      />

      {selectedImage && (
        <a
          href={selectedImage.sourceUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='absolute bottom-1 left-1 z-20 text-[9px] text-white/60 hover:text-white/90 leading-none truncate max-w-[90%]'
        >
          © {selectedImage.author} · {selectedImage.license}
        </a>
      )}
    </div>
  );
}
