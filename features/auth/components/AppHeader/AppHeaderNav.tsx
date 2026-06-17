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
    <nav className='hidden sm:flex items-center gap-1 flex-1'>
      <NavLink
        href='/birds'
        label='Birds'
        active={
          pathname === '/birds' ||
          pathname === '/' ||
          pathname === '/collection'
        }
      />
      {isAuthenticated && (
        <NavLink
          href='/locations'
          label='Locations'
          active={pathname === '/locations'}
        />
      )}
      {isAuthenticated && (
        <NavLink
          href='/photos'
          label='Photos'
          active={pathname === '/photos'}
        />
      )}
      <NavLink
        href='/bird-guide'
        label='Bird Guide'
        active={pathname === '/bird-guide'}
      />
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
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
        <span className='absolute bottom-[-1px] left-3 right-3 h-0.5 bg-primary rounded-full' />
      )}
    </Link>
  );
}
