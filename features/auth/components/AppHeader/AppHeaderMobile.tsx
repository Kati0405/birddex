'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/actions';

type Props = {
  isAuthenticated: boolean;
  seenCount?: number;
  totalBirds?: number;
  userEmail?: string;
};

export default function AppHeaderMobile({ isAuthenticated, seenCount, totalBirds, userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const currentPath = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '5px',
          width: '36px',
          height: '36px',
          padding: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: 'block',
              height: '1.5px',
              background: '#2d4a1e',
              borderRadius: '1px',
              width: i === 1 ? '60%' : '100%',
              transition: 'opacity 0.2s',
            }}
          />
        ))}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              background: 'rgba(20,32,12,0.35)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <nav
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(280px, 80vw)',
              zIndex: 50,
              background: '#f8f4ec',
              borderLeft: '1px solid #d0c8b0',
              display: 'flex',
              flexDirection: 'column',
              padding: '48px 32px 32px',
              gap: '4px',
              boxShadow: '-8px 0 32px rgba(20,32,12,0.12)',
            }}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#7a7060',
                fontSize: '20px',
                lineHeight: 1,
                padding: '4px',
              }}
            >
              ×
            </button>

            <MobileNavLink href="/" label="Catalog" active={currentPath === '/' || currentPath === '/catalog'} onClick={() => setOpen(false)} />
            {isAuthenticated && (
              <MobileNavLink href="/collection" label="My Collection" active={currentPath === '/collection'} onClick={() => setOpen(false)} />
            )}

            {isAuthenticated && seenCount !== undefined && totalBirds !== undefined && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#eee8d8',
                borderRadius: '8px',
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '11px',
                color: '#5a7a3a',
                letterSpacing: '0.08em',
              }}>
                Seen {seenCount} / {totalBirds}
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #d8d0be' }}>
              {isAuthenticated ? (
                <>
                  {userEmail && (
                    <div style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '10px',
                      color: '#9a9080',
                      marginBottom: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {userEmail}
                    </div>
                  )}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      style={{
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: '10px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: '#8a6040',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'inline-block',
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#f8f4ec',
                    background: '#3a5828',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                  }}
                >
                  Log in
                </Link>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}

function MobileNavLink({ href, label, active, onClick }: { href: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'block',
        fontFamily: 'var(--font-playfair)',
        fontSize: '1.15rem',
        fontWeight: active ? 700 : 400,
        color: active ? '#2d4a1e' : '#5a5040',
        textDecoration: 'none',
        padding: '10px 0',
        borderBottom: '1px solid #e8e0cc',
        letterSpacing: '-0.01em',
      }}
    >
      {label}
    </Link>
  );
}
