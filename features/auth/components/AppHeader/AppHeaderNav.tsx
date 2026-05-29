'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/cn';

type Props = {
  isAuthenticated: boolean;
};

export default function AppHeaderNav({ isAuthenticated }: Props) {
  const pathname = usePathname();

  return (
    <nav className="hidden sm:flex items-center gap-1 flex-1">
      <NavLink href="/" label="Catalog" active={pathname === '/' || pathname === '/catalog'} />
      {isAuthenticated && (
        <NavLink href="/collection" label="My Collection" active={pathname === '/collection'} />
      )}
      {isAuthenticated && (
        <NavLink href="/locations" label="My Locations" active={pathname === '/locations'} />
      )}
    </nav>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'relative px-3 py-1.5 rounded-md text-[13px] tracking-wide transition-colors font-sans',
        active
          ? 'font-bold text-foreground bg-secondary'
          : 'font-normal text-muted-foreground hover:text-foreground hover:bg-secondary/60',
      )}
    >
      {label}
      {active && (
        <span className="absolute bottom-[-1px] left-3 right-3 h-0.5 bg-primary rounded-full" />
      )}
    </Link>
  );
}
