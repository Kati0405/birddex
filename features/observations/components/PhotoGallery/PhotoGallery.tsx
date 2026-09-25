'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';
import { format } from 'date-fns';
import { Expand, Download, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { isCloudinaryUrl, cloudinaryPublicId } from '@/shared/lib/cloudinary-utils';
import type { ObservationPhoto } from '@/features/observations/observation-queries';

interface Props {
  photos: ObservationPhoto[];
}

function getFullSizeUrl(photoUrl: string) {
  if (isCloudinaryUrl(photoUrl)) {
    const id = cloudinaryPublicId(photoUrl);
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto/${id}`;
  }
  return photoUrl;
}

function splitIntoColumns(photos: ObservationPhoto[], columnCount: number) {
  const columns: ObservationPhoto[][] = Array.from({ length: columnCount }, () => []);
  photos.forEach((photo, index) => {
    columns[index % columnCount].push(photo);
  });
  return columns;
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
  onPrev,
  onNext,
  showNav,
}: {
  photo: ObservationPhoto;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  showNav: boolean;
}) {
  const fullUrl = getFullSizeUrl(photo.photoUrl);
  const [loaded, setLoaded] = useState(false);
  const [loadedFor, setLoadedFor] = useState(photo.observationId);
  if (loadedFor !== photo.observationId) {
    setLoadedFor(photo.observationId);
    setLoaded(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (showNav && e.key === 'ArrowLeft') onPrev();
      if (showNav && e.key === 'ArrowRight') onNext();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext, showNav]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      {showNav && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
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
            {format(new Date(photo.observedAt), 'd MMM yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}

function PhotoTile({
  photo,
  onOpen,
}: {
  photo: ObservationPhoto;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="mb-3 group relative overflow-hidden bg-secondary w-full text-left cursor-pointer border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200"
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
          {format(new Date(photo.observedAt), 'd MMM yyyy')}
        </p>
      </div>
    </button>
  );
}

function MasonryRow({
  photos,
  columnCount,
  breakpointClassName,
  onOpen,
}: {
  photos: ObservationPhoto[];
  columnCount: number;
  breakpointClassName: string;
  onOpen: (index: number) => void;
}) {
  const columns = splitIntoColumns(photos, columnCount);
  return (
    <div className={`${breakpointClassName} gap-3`}>
      {columns.map((column, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col min-w-0">
          {column.map((photo) => (
            <PhotoTile
              key={photo.observationId}
              photo={photo}
              onOpen={() => onOpen(photos.indexOf(photo))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function PhotoGallery({ photos }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const closeLightbox = useCallback(() => setExpandedIndex(null), []);
  const showPrev = useCallback(
    () => setExpandedIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const showNext = useCallback(
    () => setExpandedIndex((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length]
  );

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </div>
        <p className="font-mono text-[11px] tracking-widest uppercase">No photos yet</p>
        <p className="font-mono text-[10px] text-muted-foreground/60 max-w-xs">
          Add a photo when logging an observation
        </p>
      </div>
    );
  }

  const openAt = (index: number) => setExpandedIndex(index);

  return (
    <>
      <MasonryRow photos={photos} columnCount={Math.min(2, photos.length)} breakpointClassName="flex sm:hidden" onOpen={openAt} />
      <MasonryRow photos={photos} columnCount={Math.min(3, photos.length)} breakpointClassName="hidden sm:flex md:hidden" onOpen={openAt} />
      <MasonryRow photos={photos} columnCount={Math.min(4, photos.length)} breakpointClassName="hidden md:flex lg:hidden" onOpen={openAt} />
      <MasonryRow photos={photos} columnCount={Math.min(5, photos.length)} breakpointClassName="hidden lg:flex" onOpen={openAt} />

      {expandedIndex !== null && (
        <Lightbox
          photo={photos[expandedIndex]}
          onClose={closeLightbox}
          onPrev={showPrev}
          onNext={showNext}
          showNav={photos.length > 1}
        />
      )}
    </>
  );
}
