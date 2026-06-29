'use client';

import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface LatLng {
  lat: number;
  lng: number;
  locationName?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.suburb ?? '';
    const region = addr.state ?? addr.county ?? addr.region ?? '';
    if (city && region) return `${city}, ${region}`;
    if (city || region) return city || region;
    const name: string = data.display_name ?? '';
    if (!name) return undefined;
    const parts = name.split(',').map((s: string) => s.trim());
    return parts.length > 2 ? `${parts[0]}, ${parts[parts.length - 2]}` : name;
  } catch {
    return undefined;
  }
}

function ClickHandler({ onChange }: { onChange: (latLng: LatLng) => void }) {
  useMapEvents({
    async click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const locationName = await reverseGeocode(lat, lng);
      onChange({ lat, lng, locationName });
    },
  });
  return null;
}

function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  const prev = useRef<LatLng | null>(null);
  if (target && target !== prev.current) {
    prev.current = target;
    map.flyTo([target.lat, target.lng], 12, { duration: 1.2 });
  }
  return null;
}

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (latLng: LatLng | null) => void;
  frameColor: string;
}

export default function LocationPicker({ value, onChange, frameColor }: LocationPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
    } finally {
      setSearching(false);
    }
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const locationName = await reverseGeocode(lat, lng);
        const latLng: LatLng = { lat, lng, locationName };
        setFlyTarget(latLng);
        onChange(latLng);
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  function handleSelect(result: NominatimResult) {
    const latLng: LatLng = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      locationName: (() => {
        const parts = result.display_name.split(',').map((s: string) => s.trim());
        return parts.length > 2 ? `${parts[0]}, ${parts[parts.length - 2]}` : result.display_name;
      })(),
    };
    setFlyTarget(latLng);
    onChange(latLng);
    setResults([]);
    setQuery('');
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex gap-1'>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder='Search address or place…'
          className='flex-1 rounded px-2 py-1 text-[10px] font-mono bg-background border border-border/50 focus:outline-none focus:border-border placeholder:text-muted-foreground/40'
        />
        <button
          type='button'
          onClick={handleSearch}
          disabled={searching}
          className='rounded px-2 py-1 text-[10px] font-mono font-medium transition-colors'
          style={{ background: `${frameColor}30`, color: frameColor, border: `1px solid ${frameColor}50` }}
        >
          {searching ? '…' : 'Search'}
        </button>
        <button
          type='button'
          onClick={handleGeolocate}
          disabled={locating}
          title='Use my current location'
          aria-label='Use my current location'
          className='rounded px-2 py-1 text-[10px] font-mono font-medium transition-colors border border-border/50 hover:bg-muted/40'
        >
          {locating ? '…' : '📍 My location'}
        </button>
        {value && (
          <button
            type='button'
            onClick={() => onChange(null)}
            className='text-[10px] font-mono underline text-muted-foreground/60 hover:text-muted-foreground transition-colors px-1'
          >
            Clear
          </button>
        )}
      </div>

      {results.length > 0 && (
        <ul className='rounded border border-border/40 bg-background overflow-hidden'>
          {results.map((r, i) => (
            <li key={i}>
              <button
                type='button'
                onClick={() => handleSelect(r)}
                className='w-full text-left px-2 py-1 text-[10px] font-mono hover:bg-muted/40 transition-colors truncate'
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className='rounded-xl overflow-hidden' style={{ border: `1px solid ${frameColor}40`, height: 220 }}>
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
          <FlyTo target={flyTarget} />
          {value && <Marker position={[value.lat, value.lng]} />}
        </MapContainer>
      </div>

      {value && (
        <p className='text-[9px] font-mono text-muted-foreground/50 truncate'>
          {value.locationName ?? `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`}
        </p>
      )}
    </div>
  );
}
