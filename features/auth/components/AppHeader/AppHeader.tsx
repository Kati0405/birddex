import Link from 'next/link';
import Image from 'next/image';
import { getUser, getUserRole } from '@/features/auth/auth-helpers';
import AdminBadge from '@/shared/ui/AdminBadge/AdminBadge';
import { logoutAction } from '@/app/(auth)/actions';
import AppHeaderMobile from './AppHeaderMobile';
import AppHeaderNav from './AppHeaderNav';

export default async function AppHeader() {
  const [user, role] = await Promise.all([
    getUser(),
    getUserRole(),
  ]);
  const isAuth = !!user;
  const isAdmin = role === 'admin';

  return (
    <header className='sticky top-0 z-[100] bg-card border-b border-border shadow-[0_1px_12px_rgba(20,32,12,0.06)]'>
      <div className='h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60' />

      <div className='max-w-[1280px] mx-auto px-3 sm:px-[clamp(1rem,4vw,3rem)] h-[60px] flex items-center gap-8'>
        {/* Logo */}
        <Link
          href='/'
          className='flex items-center no-underline shrink-0'
          aria-label='birds.in.ua'
        >
          <Image
            src='/logo/birds-in-ua-horizontal.svg'
            alt='birds.in.ua'
            width={200}
            height={72}
            className='h-11 w-auto'
            priority
          />
        </Link>

        <AppHeaderNav isAuthenticated={isAuth} isAdmin={isAdmin} />

        <div className='hidden sm:flex items-center gap-3 shrink-0 ml-auto'>
          {isAuth ? (
            <UserMenu
              email={user?.email}
              avatarUrl={user?.user_metadata?.avatar_url}
              isAdmin={isAdmin}
            />
          ) : (
            <Link
              href='/login'
              className='font-mono text-[10px] tracking-[0.15em] uppercase text-primary-foreground bg-primary px-4 py-2 rounded-md no-underline font-medium hover:bg-primary/90 transition-colors'
            >
              Log in
            </Link>
          )}
        </div>

        <div className='sm:hidden ml-auto flex items-center gap-2'>
          <AppHeaderMobile
            isAuthenticated={isAuth}
            isAdmin={isAdmin}
            userEmail={user?.email}
          />
        </div>
      </div>
    </header>
  );
}

function UserMenu({
  email,
  avatarUrl,
  isAdmin,
}: {
  email?: string;
  avatarUrl?: string;
  isAdmin: boolean;
}) {
  const initial = email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className='flex items-center gap-2'>
      <div className='relative'>
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarUrl}
            alt=''
            width={30}
            height={30}
            className='w-[30px] h-[30px] rounded-full object-cover shrink-0'
          />
        ) : (
          <div className='w-[30px] h-[30px] rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0'>
            <span className='font-heading text-[13px] font-bold text-primary-foreground leading-none'>
              {initial}
            </span>
          </div>
        )}
        {isAdmin && (
          <AdminBadge className='absolute -top-1 -right-1 border-2 border-card' />
        )}
      </div>

      <form action={logoutAction}>
        <button
          type='submit'
          className='font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground bg-transparent border-0 cursor-pointer p-1 hover:text-foreground transition-colors'
        >
          Log out
        </button>
      </form>
    </div>
  );
}
