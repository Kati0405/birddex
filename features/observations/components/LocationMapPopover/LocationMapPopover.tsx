'use client';

import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

function MapLoading() {
  const t = useTranslations('LocationMapPopover');
  return (
    <div className='w-full h-full flex items-center justify-center text-[9px] font-mono text-muted-foreground'>
      {t('loadingMap')}
    </div>
  );
}

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <MapLoading />,
});

interface Props {
  lat: number;
  lng: number;
  locationName: string | null;
  frameColor: string;
  /** Controlled open state — pass true to show the modal */
  open: boolean;
  onClose: () => void;
}

export default function LocationMapModal({ lat, lng, locationName, frameColor, open, onClose }: Props) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      onClick={e => { e.stopPropagation(); onClose(); }}
    >
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' />

      <div
        className='relative z-10 overflow-hidden rounded-xl w-80 bg-card shadow-2xl'
        style={{ border: `1px solid ${frameColor}40` }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className='flex items-start justify-between px-3 py-2 border-b'
          style={{ borderColor: `${frameColor}20` }}
        >
          <div className='flex flex-col gap-0.5'>
            {locationName && (
              <span className='text-[11px] font-mono font-medium text-card-foreground leading-snug'>
                {locationName}
              </span>
            )}
            <span className='text-[9px] font-mono text-muted-foreground/60'>
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          </div>
          <button
            type='button'
            onClick={e => { e.stopPropagation(); onClose(); }}
            className='text-muted-foreground hover:text-foreground transition-colors ml-3 mt-0.5'
          >
            <X className='h-3.5 w-3.5' />
          </button>
        </div>

        <div style={{ height: 320 }}>
          <MapView lat={lat} lng={lng} frameColor={frameColor} />
        </div>
      </div>
    </div>,
    document.body
  );
}
