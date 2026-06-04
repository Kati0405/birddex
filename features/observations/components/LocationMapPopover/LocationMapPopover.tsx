'use client';

import dynamic from 'next/dynamic';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin } from 'lucide-react';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => (
  <div className='w-full h-full flex items-center justify-center text-[9px] font-mono text-muted-foreground'>
    Loading map…
  </div>
) });

interface Props {
  lat: number;
  lng: number;
  locationName: string | null;
  frameColor: string;
}

export default function LocationMapPopover({ lat, lng, locationName, frameColor }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        onClick={e => e.stopPropagation()}
        className='flex items-center gap-1 min-w-0 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0'
      >
        <MapPin className='h-2.5 w-2.5 shrink-0' style={{ color: frameColor }} />
        <span className='text-[9px] font-mono text-muted-foreground truncate'>
          {locationName ?? `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side='top'
        align='start'
        className='p-0 overflow-hidden rounded-xl'
        style={{ width: 240, border: `1px solid ${frameColor}40` }}
        onClick={e => e.stopPropagation()}
      >
        {locationName && (
          <div className='px-2.5 py-1.5 text-[9px] font-mono text-muted-foreground border-b' style={{ borderColor: `${frameColor}20` }}>
            {locationName}
          </div>
        )}
        <div style={{ height: 160 }}>
          <MapView lat={lat} lng={lng} frameColor={frameColor} />
        </div>
        <div className='px-2.5 py-1 text-[8px] font-mono text-muted-foreground/50 border-t text-center' style={{ borderColor: `${frameColor}20` }}>
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      </PopoverContent>
    </Popover>
  );
}
