import Link from 'next/link';
import { getUser } from '@/features/auth/auth-helpers';
import { getBirds } from '@/features/birds/bird-queries';
import { getObservationCount } from '@/features/observations/observation-queries';
import { logoutAction } from '@/app/(auth)/actions';
import AppHeaderMobile from './AppHeaderMobile';
import AppHeaderNav from './AppHeaderNav';

export default async function AppHeader() {
  const [user, birds] = await Promise.all([getUser(), getBirds()]);
  const seenCount = user ? await getObservationCount(user.id) : undefined;
  const totalBirds = birds.length;

  const isAuth = !!user;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#f8f4ec',
        borderBottom: '1px solid #d8d0be',
        boxShadow: '0 1px 12px rgba(20,32,12,0.06)',
      }}
    >
      <div style={{ height: '2px', background: 'linear-gradient(to right, #3a5828, #6a9048, #3a5828)' }} />

      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px)',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path
              d="M4 18 C6 14 9 10 14 6 C17 4 20 3 20 3 C20 3 19 6 17 9 C13 14 9 16 6 18 Z"
              fill="#3a5828"
              opacity="0.9"
            />
            <path
              d="M4 18 C7 15 11 12 16 8"
              stroke="#6a9048"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M4 18 L5 20" stroke="#3a5828" strokeWidth="1.2" strokeLinecap="round" />
          </svg>

          <span style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#1e3310',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>
              Bird
            </span>
            <em style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.45rem',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#5a7a3a',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>
              Dex
            </em>
          </span>
        </Link>

        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#c8c0a8', flexShrink: 0 }} />

        <AppHeaderNav isAuthenticated={isAuth} />

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: 'auto' }}
          className="birddex-desktop-right"
        >
          {isAuth ? (
            <>
              {seenCount !== undefined && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: '#eee8d8',
                  borderRadius: '20px',
                  border: '1px solid #d0c8b0',
                }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <ellipse cx="6.5" cy="6.5" rx="5.5" ry="3.5" stroke="#5a7a3a" strokeWidth="1.2" fill="none"/>
                    <circle cx="6.5" cy="6.5" r="1.8" fill="#5a7a3a"/>
                  </svg>
                  <span style={{
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '10px',
                    color: '#4a6838',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    {seenCount} / {totalBirds}
                  </span>
                </div>
              )}

              <UserMenu email={user?.email} />
            </>
          ) : (
            <Link
              href="/login"
              style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#f8f4ec',
                background: '#3a5828',
                padding: '8px 18px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'background 0.15s',
              }}
            >
              Log in
            </Link>
          )}
        </div>

        <div className="birddex-mobile-menu">
          <AppHeaderMobile
            isAuthenticated={isAuth}
            seenCount={seenCount}
            totalBirds={totalBirds}
            userEmail={user?.email}
          />
        </div>
      </div>

      <style>{`
        .birddex-desktop-nav { }
        .birddex-desktop-right { }
        .birddex-mobile-menu { display: none; }

        @media (max-width: 640px) {
          .birddex-desktop-nav { display: none !important; }
          .birddex-desktop-right { display: none !important; }
          .birddex-mobile-menu { display: flex; margin-left: auto; }
        }
      `}</style>
    </header>
  );
}


function UserMenu({ email }: { email?: string }) {
  const initial = email?.[0]?.toUpperCase() ?? '?';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4a7030, #6a9048)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '13px',
          fontWeight: 700,
          color: '#f0e8d0',
          lineHeight: 1,
        }}>
          {initial}
        </span>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '9px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#9a9080',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            transition: 'color 0.15s',
          }}
        >
          Log out
        </button>
      </form>
    </div>
  );
}
