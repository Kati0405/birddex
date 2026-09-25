import { format } from 'date-fns';
import { RARITY_COLOR, type Rarity } from '@/entities/bird-domain';
import type { ObservationShareData } from '@/features/observations/public-share-queries';

// Pure Satori-compatible JSX for use inside ImageResponse: <div>/<img>/<svg>
// with inline `style` objects — no Tailwind classes, no external CSS.
//
// lucide-react's icon components are Client Components and cannot be
// invoked from ImageResponse's server-only render path ("Attempted to call
// the default export of .../Icon.mjs from the server"), so the icons used
// here are plain inline <svg> matching lucide's own path data (24x24
// viewBox, stroke-based) to stay visually identical to the rest of the app.

function IconSvg({ size, color, children }: { size: number; color: string; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke={color}
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      {children}
    </svg>
  );
}

function CalendarIcon({ size, color }: { size: number; color: string }) {
  return (
    <IconSvg size={size} color={color}>
      <path d='M8 2v4' />
      <path d='M16 2v4' />
      <rect width='18' height='18' x='3' y='4' rx='2' />
      <path d='M3 10h18' />
    </IconSvg>
  );
}

function MapPinIcon({ size, color }: { size: number; color: string }) {
  return (
    <IconSvg size={size} color={color}>
      <path d='M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0' />
      <circle cx='12' cy='10' r='3' />
    </IconSvg>
  );
}

function EyeIcon({ size, color }: { size: number; color: string }) {
  return (
    <IconSvg size={size} color={color}>
      <path d='M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0' />
      <circle cx='12' cy='12' r='3' />
    </IconSvg>
  );
}

function MusicIcon({ size, color }: { size: number; color: string }) {
  return (
    <IconSvg size={size} color={color}>
      <path d='M9 18V5l12-2v13' />
      <circle cx='6' cy='18' r='3' />
      <circle cx='18' cy='16' r='3' />
    </IconSvg>
  );
}

function CameraIcon({ size, color }: { size: number; color: string }) {
  return (
    <IconSvg size={size} color={color}>
      <path d='M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z' />
      <circle cx='12' cy='13' r='3' />
    </IconSvg>
  );
}

interface ShareCardProps {
  data: ObservationShareData;
  size: '4:5' | 'og';
  /** Absolute origin (e.g. from the request URL) used to resolve /hero/shared-card-background.png — ImageResponse/Satori can only load images by absolute URL or embedded data URI, never a public/-relative path. */
  origin: string;
}

export default function ShareCard({ data, size, origin }: ShareCardProps) {
  const frameColor = RARITY_COLOR[data.rarity as Rarity] ?? RARITY_COLOR.Common;
  const isOg = size === 'og';
  const hasEvidence = data.methods.seen || data.methods.heard || data.methods.photographed;

  const attributionLabel = data.photo.source === 'observation' ? 'Photo by' : 'Photo:';
  const attributionName =
    data.photo.source === 'observation'
      ? (data.photo.credit ?? 'birds.in.ua')
      : (data.photo.credit ?? 'Wikimedia Commons');
  const attributionFontSize = isOg ? 11 : 13;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isOg ? 'row' : 'column',
        width: '100%',
        height: '100%',
        background: '#fdfaf4',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: isOg ? '46%' : '100%',
          height: isOg ? '100%' : '58.3%',
          background: '#ede8dc',
        }}
      >
        {data.photo.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photo.url}
            alt={data.birdName}
            width={isOg ? 552 : 1080}
            height={isOg ? 630 : 810}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        )}
        {data.isFirstObservationOfSpecies && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${origin}/share/1st-time-badge.png`}
            alt='First encounter with this species'
            width={isOg ? 40 : 40}
            height={isOg ? 40 : 40}
            style={{ position: 'absolute', top: 12, right: 12 }}
          />
        )}
        {data.photo.url && (
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '30%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            }}
          />
        )}
        {data.photo.url && (
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              left: 12,
              bottom: 8,
              fontSize: attributionFontSize,
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {attributionLabel} {attributionName}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          flex: 1,
          padding: isOg ? '28px 36px' : '36px 44px',
          gap: 14,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${origin}/hero/shared-card-background.png`}
          alt=''
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: isOg ? '45%' : '30%',
            objectFit: 'cover',
            objectPosition: 'bottom',
            opacity: 0.6,
          }}
        />

        <div
          style={{
            display: 'flex',
            fontSize: isOg ? 14 : 16,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: '#7a7060',
          }}
        >
          Look who I found!
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: isOg ? 38 : 48, fontWeight: 700, color: '#1c1810' }}>
              {data.birdName}
            </div>
            <div style={{ display: 'flex', fontSize: isOg ? 20 : 24, fontStyle: 'italic', color: '#7a7060' }}>
              {data.scientificName}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: `${frameColor}18`,
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 9,
                height: 9,
                background: frameColor,
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              }}
            />
            <div style={{ display: 'flex', fontSize: isOg ? 16 : 20, color: frameColor }}>{data.rarity}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: isOg ? 18 : 22, color: '#1c1810' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarIcon size={isOg ? 18 : 22} color='#7a7060' />
            <div style={{ display: 'flex' }}>{format(new Date(data.observedAt), 'd MMM yyyy')}</div>
          </div>
          {data.location.displayName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPinIcon size={isOg ? 18 : 22} color='#7a7060' />
              <div style={{ display: 'flex' }}>{data.location.displayName}</div>
            </div>
          )}
        </div>

        {hasEvidence && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              paddingTop: 12,
              borderTop: '1px solid #d8d0be',
              fontSize: isOg ? 16 : 20,
              color: '#1c1810',
            }}
          >
            {data.methods.seen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <EyeIcon size={isOg ? 16 : 20} color='#7a7060' />
                <div style={{ display: 'flex' }}>Seen</div>
              </div>
            )}
            {data.methods.heard && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MusicIcon size={isOg ? 16 : 20} color='#7a7060' />
                <div style={{ display: 'flex' }}>Heard</div>
              </div>
            )}
            {data.methods.photographed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CameraIcon size={isOg ? 16 : 20} color='#7a7060' />
                <div style={{ display: 'flex' }}>Photographed</div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flex: 1 }} />

        {data.author.displayName && (
          <div style={{ display: 'flex', fontSize: isOg ? 14 : 16, color: '#7a7060' }}>
            Observed by <span style={{ fontWeight: 500, color: '#1c1810', marginLeft: 4 }}>{data.author.displayName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
