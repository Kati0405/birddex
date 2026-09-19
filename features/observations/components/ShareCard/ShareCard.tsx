import { format } from 'date-fns';
import { RARITY_COLOR, type Rarity } from '@/entities/bird-domain';
import type { ObservationShareData } from '@/features/observations/public-share-queries';

// Pure Satori-compatible JSX for use inside ImageResponse: only <div>/<img>/
// <span>/<p> with inline `style` objects — no Tailwind classes, no external
// CSS, no flexbox-adjacent tricks Satori doesn't support.

interface ShareCardProps {
  data: ObservationShareData;
  size: '4:5' | 'og';
}

export default function ShareCard({ data, size }: ShareCardProps) {
  const frameColor = RARITY_COLOR[data.rarity as Rarity] ?? RARITY_COLOR.Common;
  const isOg = size === 'og';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isOg ? 'row' : 'column',
        width: '100%',
        height: '100%',
        background: '#faf6ed',
        border: `${isOg ? 10 : 14}px solid ${frameColor}`,
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: isOg ? '46%' : '100%',
          height: isOg ? '100%' : '58%',
          background: '#e5e0d3',
        }}
      >
        {data.photo.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photo.url}
            alt={data.birdName}
            width={isOg ? 552 : 1052}
            height={isOg ? 610 : 700}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        )}
        {data.isFirstObservationOfSpecies && (
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 24,
              right: 24,
              padding: '8px 16px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.55)',
              color: 'white',
              fontSize: 22,
            }}
          >
            First time!
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: isOg ? '32px 40px' : '40px 48px',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: isOg ? 40 : 52, fontWeight: 700, color: '#2a2620' }}>
            {data.birdName}
          </div>
          <div style={{ display: 'flex', fontSize: isOg ? 22 : 28, fontStyle: 'italic', color: '#6b6558' }}>
            {data.scientificName}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: isOg ? 20 : 24, color: '#6b6558' }}>
          <div style={{ display: 'flex' }}>{format(new Date(data.observedAt), 'd MMM yyyy')}</div>
          {data.location.displayName && <div style={{ display: 'flex' }}>{data.location.displayName}</div>}
        </div>

        <div
          style={{
            display: 'flex',
            padding: '4px 14px',
            borderRadius: 999,
            background: `${frameColor}22`,
            color: frameColor,
            fontSize: isOg ? 18 : 22,
            width: 'fit-content',
          }}
        >
          {data.rarity}
        </div>

        {data.quality != null && (
          <div style={{ display: 'flex', fontSize: isOg ? 20 : 24, color: '#c99a2e' }}>
            {'★'.repeat(data.quality)}
            {'☆'.repeat(5 - data.quality)}
          </div>
        )}

        <div style={{ display: 'flex', flex: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 16, color: '#a39c8a' }}>
          {data.photo.credit && <div style={{ display: 'flex' }}>{data.photo.credit}</div>}
          <div style={{ display: 'flex', letterSpacing: 2, textTransform: 'uppercase' }}>birds.in.ua</div>
        </div>
      </div>
    </div>
  );
}
