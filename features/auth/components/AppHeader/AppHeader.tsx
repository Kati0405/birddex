import Link from 'next/link';
import Image from 'next/image';
import { getUser, getUserRole } from '@/features/auth/auth-helpers';
import { getNickname, getDisplayName } from '@/features/profile/profile-queries';
import AppHeaderMobile from './AppHeaderMobile';
import AppHeaderNav from './AppHeaderNav';
import HeaderAvatarLink from './HeaderAvatarLink';

export default async function AppHeader() {
  const [user, role] = await Promise.all([
    getUser(),
    getUserRole(),
  ]);
  const isAuth = !!user;
  const isAdmin = role === 'admin';
  const nickname = user ? await getNickname(user.id) : null;
  const displayName = user ? getDisplayName(user, nickname) : undefined;

  return (
    <header className='sticky top-0 z-[100] bg-card border-b border-border shadow-[0_1px_12px_rgba(20,32,12,0.06)]'>
      <div className='h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60' />

      <div className='max-w-[1280px] mx-auto px-3 sm:px-[clamp(1rem,4vw,3rem)] h-[60px] flex items-center gap-8'>
        <div className='md:hidden flex items-center'>
          <AppHeaderMobile
            isAuthenticated={isAuth}
            isAdmin={isAdmin}
          />
        </div>

        {/* Logo */}
        <Link
          href='/'
          className='flex items-center no-underline shrink-0 md:mr-0 mx-auto md:mx-0'
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

        <div className='hidden md:flex items-center gap-3 shrink-0 ml-auto'>
          {isAuth ? (
            <HeaderAvatarLink
              displayName={displayName}
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

        <div className='md:hidden flex items-center'>
          {isAuth ? (
            <HeaderAvatarLink
              displayName={displayName}
              avatarUrl={user?.user_metadata?.avatar_url}
              isAdmin={isAdmin}
            />
          ) : (
            <Link
              href='/login'
              className='font-mono text-[10px] tracking-[0.15em] uppercase text-primary-foreground bg-primary px-3 py-1.5 rounded-md no-underline font-medium hover:bg-primary/90 transition-colors'
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
