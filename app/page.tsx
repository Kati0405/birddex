import { getBirds } from '@/lib/birds';
import BirdSearch from '@/components/BirdSearch';
import AuthBar from '@/components/AuthBar';
import { getUser, getUserRole } from '@/lib/auth';
import { getCollectedCount } from '@/lib/collection';

export default async function Home() {
  const [birds, user, role] = await Promise.all([getBirds(), getUser(), getUserRole()]);
  const collectedCount = user ? await getCollectedCount(user.id) : null;

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header
        style={{
          background: 'linear-gradient(160deg, #1a2e0f 0%, #243d16 35%, #1e3512 65%, #162808 100%)',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid #3a5a22',
        }}
      >
        {/* Deep atmospheric sky gradient — forest canopy looking up */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #2d5a1a44 0%, transparent 70%)',
          pointerEvents: 'none',
        }}/>

        {/* Noise grain */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.055,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
          pointerEvents: 'none',
        }}/>

        {/* Large watermark bird — flight silhouette, dead center background */}
        <svg
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -54%)', width: 'min(520px, 70vw)', opacity: 0.055, pointerEvents: 'none' }}
          viewBox="0 0 520 200"
          fill="none"
        >
          {/* Broad-winged bird in soaring flight, seen from below */}
          <path d="M260,105 C240,95 200,75 155,55 C120,38 85,28 55,30 C35,31 18,38 10,48 C6,53 7,59 14,61 C28,65 55,60 85,58 C115,56 148,62 175,72 C200,81 225,95 245,103 Z" fill="#e8f0d0"/>
          <path d="M260,105 C280,95 320,75 365,55 C400,38 435,28 465,30 C485,31 502,38 510,48 C514,53 513,59 506,61 C492,65 465,60 435,58 C405,56 372,62 345,72 C320,81 295,95 275,103 Z" fill="#e8f0d0"/>
          {/* Body */}
          <ellipse cx="260" cy="108" rx="28" ry="12" fill="#e8f0d0"/>
          {/* Head */}
          <ellipse cx="282" cy="100" rx="12" ry="10" fill="#e8f0d0"/>
          {/* Beak */}
          <path d="M293,98 L308,95 L294,103 Z" fill="#e8f0d0"/>
          {/* Tail */}
          <path d="M232,112 C225,120 215,128 205,130 C215,125 222,118 228,116 Z" fill="#e8f0d0"/>
          <path d="M232,112 C228,122 222,132 212,136 C220,128 226,120 230,117 Z" fill="#e8f0d0"/>
          <path d="M232,112 C230,124 228,135 220,140 C225,131 228,122 231,118 Z" fill="#e8f0d0"/>
          {/* Wing feather detail lines */}
          <path d="M175,72 C185,80 210,92 240,101" stroke="#c8d8a8" strokeWidth="0.5" fill="none" opacity="0.6"/>
          <path d="M155,58 C170,68 200,84 235,99" stroke="#c8d8a8" strokeWidth="0.5" fill="none" opacity="0.5"/>
          <path d="M345,72 C335,80 310,92 280,101" stroke="#c8d8a8" strokeWidth="0.5" fill="none" opacity="0.6"/>
          <path d="M365,58 C350,68 320,84 285,99" stroke="#c8d8a8" strokeWidth="0.5" fill="none" opacity="0.5"/>
        </svg>

        {/* Engraved botanical left margin — tall thin branches */}
        <svg
          style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '180px', opacity: 0.22, pointerEvents: 'none' }}
          viewBox="0 0 180 200"
          fill="none"
          preserveAspectRatio="xMinYMid meet"
        >
          <path d="M18,200 C22,170 16,140 22,105 C28,70 18,45 28,10" stroke="#b8cc88" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          <path d="M22,105 C40,95 58,80 68,60" stroke="#b8cc88" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
          <path d="M20,132 C42,120 60,108 72,88" stroke="#b8cc88" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
          <path d="M19,158 C44,144 60,134 70,115" stroke="#b8cc88" strokeWidth="0.7" fill="none" strokeLinecap="round"/>
          {/* Leaves */}
          <path d="M68,60 C72,50 80,48 78,58 C76,65 70,65 68,60 Z" fill="#b8cc88" opacity="0.8"/>
          <path d="M72,88 C76,78 85,76 83,86 C81,94 74,93 72,88 Z" fill="#b8cc88" opacity="0.7"/>
          <path d="M70,115 C74,105 83,104 81,113 C79,121 72,120 70,115 Z" fill="#b8cc88" opacity="0.7"/>
          <path d="M28,10 C35,2 44,2 40,12 C37,20 29,18 28,10 Z" fill="#b8cc88" opacity="0.8"/>
          {/* Second stalk */}
          <path d="M52,200 C54,172 48,148 56,118 C62,92 55,68 65,40" stroke="#b8cc88" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.6"/>
          <path d="M56,118 C70,110 82,98 88,82" stroke="#b8cc88" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.5"/>
          <path d="M88,82 C92,73 100,71 97,80 C95,88 89,87 88,82 Z" fill="#b8cc88" opacity="0.5"/>
        </svg>

        {/* Engraved botanical right margin */}
        <svg
          style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '180px', opacity: 0.22, transform: 'scaleX(-1)', pointerEvents: 'none' }}
          viewBox="0 0 180 200"
          fill="none"
          preserveAspectRatio="xMinYMid meet"
        >
          <path d="M18,200 C22,170 16,140 22,105 C28,70 18,45 28,10" stroke="#b8cc88" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          <path d="M22,105 C40,95 58,80 68,60" stroke="#b8cc88" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
          <path d="M20,132 C42,120 60,108 72,88" stroke="#b8cc88" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
          <path d="M19,158 C44,144 60,134 70,115" stroke="#b8cc88" strokeWidth="0.7" fill="none" strokeLinecap="round"/>
          <path d="M68,60 C72,50 80,48 78,58 C76,65 70,65 68,60 Z" fill="#b8cc88" opacity="0.8"/>
          <path d="M72,88 C76,78 85,76 83,86 C81,94 74,93 72,88 Z" fill="#b8cc88" opacity="0.7"/>
          <path d="M70,115 C74,105 83,104 81,113 C79,121 72,120 70,115 Z" fill="#b8cc88" opacity="0.7"/>
          <path d="M28,10 C35,2 44,2 40,12 C37,20 29,18 28,10 Z" fill="#b8cc88" opacity="0.8"/>
          <path d="M52,200 C54,172 48,148 56,118 C62,92 55,68 65,40" stroke="#b8cc88" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.6"/>
          <path d="M56,118 C70,110 82,98 88,82" stroke="#b8cc88" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.5"/>
          <path d="M88,82 C92,73 100,71 97,80 C95,88 89,87 88,82 Z" fill="#b8cc88" opacity="0.5"/>
        </svg>

        {/* Top ruled border */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '32px',
          right: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #4a7030 30%, #4a7030 70%, transparent)' }}/>
          <svg width="6" height="6" viewBox="0 0 6 6"><rect x="1" y="1" width="4" height="4" fill="none" stroke="#6a9040" strokeWidth="0.8" transform="rotate(45 3 3)"/></svg>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #4a7030 30%, #4a7030 70%, transparent)' }}/>
        </div>

        {/* Main content — horizontal layout */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '38px clamp(48px, 8vw, 120px) 34px',
          gap: '32px',
          minHeight: '148px',
        }}>

          {/* Left column — classification metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '0.3em',
              color: '#6a9048',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              Vol. I · Field Compendium
            </div>
            <div style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              fontStyle: 'italic',
              color: '#b8cc88',
              fontWeight: 400,
              lineHeight: 1.3,
            }}>
              Aves of the Known World
            </div>
            {/* Ruled separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <div style={{ width: '24px', height: '1px', background: '#3a5828' }}/>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#4a7030' }}/>
              <div style={{ width: '48px', height: '1px', background: '#3a5828' }}/>
            </div>
            <div style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '0.2em',
              color: '#4a6838',
              marginTop: '2px',
            }}>
              {birds.length} species · catalogued
            </div>
          </div>

          {/* Center — main logotype */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            {/* Crest ornament above */}
            <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
                {/* Stylized perched bird crest */}
                <path d="M24,2 C22,4 18,6 14,7 C10,8 6,8 4,10 C8,10 12,9 16,10 C13,12 10,14 8,17" stroke="#8ab060" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
                <path d="M24,2 C26,4 30,6 34,7 C38,8 42,8 44,10 C40,10 36,9 32,10 C35,12 38,14 40,17" stroke="#8ab060" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
                <circle cx="24" cy="2" r="2.5" fill="#8ab060" opacity="0.9"/>
                <path d="M20,27 L24,18 L28,27" stroke="#6a9048" strokeWidth="0.7" fill="none"/>
                <line x1="16" y1="27" x2="32" y2="27" stroke="#4a7030" strokeWidth="0.6"/>
              </svg>
            </div>

            <h1 style={{ margin: 0, lineHeight: 1 }}>
              <span style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(2.8rem, 7vw, 5.2rem)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#f0e6cc',
                display: 'block',
              }}>
                Bird
                <em style={{
                  fontStyle: 'italic',
                  color: '#c8e090',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                }}>Dex</em>
              </span>
            </h1>

            {/* Subtitle rule */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
              <div style={{ height: '1px', width: '28px', background: 'linear-gradient(to right, transparent, #5a8038)' }}/>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M4 0 L5.5 2.5 L8 4 L5.5 5.5 L4 8 L2.5 5.5 L0 4 L2.5 2.5 Z" fill="#7aaa50" opacity="0.8"/>
              </svg>
              <div style={{ height: '1px', width: '28px', background: 'linear-gradient(to left, transparent, #5a8038)' }}/>
            </div>
          </div>

          {/* Right column — edition / provenance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', textAlign: 'right' }}>
            <div style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '0.3em',
              color: '#6a9048',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              First Edition
            </div>
            <div style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
              fontStyle: 'italic',
              color: '#b8cc88',
              fontWeight: 400,
              lineHeight: 1.3,
            }}>
              Observations from the Wild
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
              <div style={{ width: '48px', height: '1px', background: '#3a5828' }}/>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#4a7030' }}/>
              <div style={{ width: '24px', height: '1px', background: '#3a5828' }}/>
            </div>
            <div style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '0.2em',
              color: '#4a6838',
              marginTop: '2px',
            }}>
              MMXXVI · Illustrated
            </div>
            <div style={{ marginTop: '8px' }}>
              <AuthBar />
            </div>
            {collectedCount !== null && (
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '0.15em',
                color: '#6a9048',
                marginTop: '2px',
              }}>
                {collectedCount} / {birds.length} collected
              </div>
            )}
          </div>
        </div>

        {/* Bottom ruled border */}
        <div style={{
          position: 'absolute',
          bottom: '14px',
          left: '32px',
          right: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #4a7030 30%, #4a7030 70%, transparent)' }}/>
          <svg width="6" height="6" viewBox="0 0 6 6"><rect x="1" y="1" width="4" height="4" fill="none" stroke="#6a9040" strokeWidth="0.8" transform="rotate(45 3 3)"/></svg>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #4a7030 30%, #4a7030 70%, transparent)' }}/>
        </div>

      </header>

      <BirdSearch birds={birds} isAdmin={role === 'admin'} />
    </main>
  );
}
