'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { Expand, Download, X, Loader2 } from 'lucide-react';
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

function getFullSizeUrl(photoUrl: string) {
  if (isCloudinaryUrl(photoUrl)) {
    const id = cloudinaryPublicId(photoUrl);
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto/${id}`;
  }
  return photoUrl;
}

async function downloadPhoto(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

function Lightbox({
  photo,
  onClose,
}: {
  photo: ObservationPhoto;
  onClose: () => void;
}) {
  const fullUrl = getFullSizeUrl(photo.photoUrl);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {!loaded && (
          <div className="flex items-center justify-center py-32">
            <Loader2 size={28} className="animate-spin text-white/50" />
          </div>
        )}
        {isCloudinaryUrl(photo.photoUrl) ? (
          <CldImage
            src={cloudinaryPublicId(photo.photoUrl)}
            alt={photo.birdNameEng}
            width={1200}
            height={1200}
            crop="limit"
            onLoad={() => setLoaded(true)}
            className={`max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <Image
            src={photo.photoUrl}
            alt={photo.birdNameEng}
            width={1200}
            height={1200}
            unoptimized
            onLoad={() => setLoaded(true)}
            className={`max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-lg transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() =>
              downloadPhoto(fullUrl, `${photo.birdNameEng.replace(/\s+/g, '-').toLowerCase()}.jpg`)
            }
            className="p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
            aria-label="Download photo"
          >
            <Download size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg">
          <p className="font-heading text-[15px] text-white leading-tight">{photo.birdNameEng}</p>
          <p className="font-mono text-[10px] text-white/60 mt-0.5 tracking-wide">
            {formatDate(photo.observedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PhotoGallery({ photos }: Props) {
  const [expanded, setExpanded] = useState<ObservationPhoto | null>(null);
  const closeLightbox = useCallback(() => setExpanded(null), []);

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
    <>
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.observationId}
            onClick={() => setExpanded(photo)}
            className="break-inside-avoid mb-2 group relative overflow-hidden rounded-md bg-secondary w-full text-left cursor-pointer"
            aria-label={`Expand photo of ${photo.birdNameEng}`}
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

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200" />

            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white/70 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
              <Expand size={14} aria-hidden="true" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-200">
              <p className="font-mono text-[11px] text-white tracking-wide">
                {photo.birdNameEng}
              </p>
              <p className="font-mono text-[9px] text-white/60 mt-0.5 tracking-wide">
                {formatDate(photo.observedAt)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {expanded && <Lightbox photo={expanded} onClose={closeLightbox} />}
    </>
  );
}
