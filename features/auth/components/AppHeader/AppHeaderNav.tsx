'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/shared/lib/cn';
import AdminBadge from '@/shared/ui/AdminBadge/AdminBadge';

type Props = {
  isAuthenticated: boolean;
  isAdmin?: boolean;
};

export default function AppHeaderNav({ isAuthenticated, isAdmin }: Props) {
  const pathname = usePathname();
  const t = useTranslations('Navigation');

  return (
    <nav className='hidden sm:flex items-center gap-1 flex-1'>
      <NavLink href='/birds' label={t('birds')} active={pathname === '/birds'} />
      {isAuthenticated && (
        <NavLink href='/observations' label={t('observations')} active={pathname === '/observations'} />
      )}
      {isAuthenticated && (
        <NavLink href='/locations' label={t('locations')} active={pathname === '/locations'} />
      )}
      {isAuthenticated && (
        <NavLink href='/photos' label={t('photos')} active={pathname === '/photos'} />
      )}
      <NavLink href='/ask-robin' label={t('askRobin')} active={pathname === '/ask-robin'} />
      {isAdmin && (
        <NavLink href='/admin/add-bird' label={t('addBird')} active={pathname === '/admin/add-bird'} adminBadge />
      )}
    </nav>
  );
}

function NavLink({
  href,
  label,
  active,
  adminBadge,
}: {
  href: string;
  label: string;
  active: boolean;
  adminBadge?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] tracking-wide transition-colors font-sans',
        active
          ? 'font-bold text-foreground bg-secondary'
          : 'font-normal text-muted-foreground hover:text-foreground hover:bg-secondary/60',
      )}
    >
      {label}
      {adminBadge && <AdminBadge />}
      {active && (
        <span className='absolute bottom-[-1px] left-3 right-3 h-0.5 bg-primary rounded-full' />
      )}
    </Link>
  );
}
