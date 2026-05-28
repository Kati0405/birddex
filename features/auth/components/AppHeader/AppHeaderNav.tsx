'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  isAuthenticated: boolean;
};

export default function AppHeaderNav({ isAuthenticated }: Props) {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flex: 1,
      }}
      className="birddex-desktop-nav"
    >
      <NavLink href="/" label="Catalog" active={pathname === '/' || pathname === '/catalog'} />
      {isAuthenticated && (
        <NavLink href="/collection" label="My Collection" active={pathname === '/collection'} />
      )}
    </nav>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: 'var(--font-lato)',
        fontSize: '13px',
        fontWeight: active ? 700 : 400,
        letterSpacing: '0.02em',
        color: active ? '#1e3310' : '#7a7060',
        textDecoration: 'none',
        padding: '6px 12px',
        borderRadius: '6px',
        background: active ? '#eae4d4' : 'transparent',
        transition: 'background 0.15s, color 0.15s',
        position: 'relative',
      }}
    >
      {label}
      {active && (
        <span style={{
          position: 'absolute',
          bottom: '-1px',
          left: '12px',
          right: '12px',
          height: '2px',
          background: '#5a7a3a',
          borderRadius: '1px',
        }} />
      )}
    </Link>
  );
}
