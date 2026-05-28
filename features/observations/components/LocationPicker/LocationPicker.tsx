'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface ClickHandlerProps {
  onChange: (latLng: LatLng) => void;
}

function ClickHandler({ onChange }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (latLng: LatLng | null) => void;
  frameColor: string;
}

export default function LocationPicker({ value, onChange, frameColor }: LocationPickerProps) {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <span className='text-xs text-muted-foreground tracking-wide'>
          Where did you see it? <span className='text-muted-foreground/60'>(optional)</span>
        </span>
        {value && (
          <button
            type='button'
            onClick={() => onChange(null)}
            className='text-xs underline text-muted-foreground/60 hover:text-muted-foreground transition-colors'
          >
            Clear
          </button>
        )}
      </div>

      <div
        className='rounded-xl overflow-hidden'
        style={{ border: `1px solid ${frameColor}40`, height: 220 }}
      >
        <MapContainer
          center={value ?? [48.5, 31.5]}
          zoom={value ? 10 : 5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          <ClickHandler onChange={onChange} />
          {value && <Marker position={[value.lat, value.lng]} />}
        </MapContainer>
      </div>

      {value && (
        <p className='text-xs text-muted-foreground/60'>
          {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}
