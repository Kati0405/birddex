'use client';

import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { isCloudinaryUrl, cloudinaryPublicId } from '@/shared/lib/cloudinary-utils';
import type { ObservationPhoto } from '@/features/observations/observation-queries';

interface Props {
  photos: ObservationPhoto[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PhotoGallery({ photos }: Props) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-30"
        >
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        <p className="font-mono text-[11px] tracking-widest uppercase">No photos yet</p>
        <p className="font-mono text-[10px] text-muted-foreground/60">
          Add a photo when logging an observation
        </p>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2">
      {photos.map((photo) => (
        <div
          key={photo.observationId}
          className="break-inside-avoid mb-2 group relative overflow-hidden rounded-md bg-secondary"
        >
          <div className="relative w-full">
            {isCloudinaryUrl(photo.photoUrl) ? (
              <CldImage
                src={cloudinaryPublicId(photo.photoUrl)}
                alt={photo.birdNameEng}
                width={400}
                height={400}
                crop="fill"
                gravity="auto"
                className="w-full h-auto block"
              />
            ) : (
              <Image
                src={photo.photoUrl}
                alt={photo.birdNameEng}
                width={400}
                height={400}
                unoptimized
                className="w-full h-auto block"
              />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <p className="font-heading text-[13px] text-white leading-tight">{photo.birdNameEng}</p>
            <p className="font-mono text-[9px] text-white/60 mt-0.5 tracking-wide">
              {formatDate(photo.observedAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
