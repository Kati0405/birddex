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
    <header className="sticky top-0 z-[100] bg-card border-b border-border shadow-[0_1px_12px_rgba(20,32,12,0.06)]">
      <div className="h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

      <div className="max-w-[1280px] mx-auto px-3 sm:px-[clamp(1rem,4vw,3rem)] h-[60px] flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path
              d="M4 18 C6 14 9 10 14 6 C17 4 20 3 20 3 C20 3 19 6 17 9 C13 14 9 16 6 18 Z"
              fill="currentColor"
              className="text-primary"
              opacity="0.9"
            />
            <path
              d="M4 18 C7 15 11 12 16 8"
              stroke="currentColor"
              className="text-primary/70"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M4 18 L5 20" stroke="currentColor" className="text-primary" strokeWidth="1.2" strokeLinecap="round" />
          </svg>

          <span className="flex items-baseline gap-px">
            <span className="font-heading text-[1.45rem] font-black text-foreground tracking-[-0.03em] leading-none">
              Bird
            </span>
            <em className="font-heading text-[1.45rem] font-bold italic text-primary tracking-[-0.03em] leading-none">
              Dex
            </em>
          </span>
        </Link>

        <span className="w-1 h-1 rounded-full bg-border shrink-0" />

        <AppHeaderNav isAuthenticated={isAuth} />

        <div className="hidden sm:flex items-center gap-3 shrink-0 ml-auto">
          {isAuth ? (
            <>
              {seenCount !== undefined && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary rounded-full border border-border">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <ellipse cx="6.5" cy="6.5" rx="5.5" ry="3.5" stroke="currentColor" className="text-primary" strokeWidth="1.2" fill="none"/>
                    <circle cx="6.5" cy="6.5" r="1.8" fill="currentColor" className="text-primary"/>
                  </svg>
                  <span className="font-mono text-[10px] text-primary tracking-[0.05em] whitespace-nowrap">
                    {seenCount} / {totalBirds}
                  </span>
                </div>
              )}
              <UserMenu email={user?.email} />
            </>
          ) : (
            <Link
              href="/login"
              className="font-mono text-[10px] tracking-[0.15em] uppercase text-primary-foreground bg-primary px-4 py-2 rounded-md no-underline font-medium hover:bg-primary/90 transition-colors"
            >
              Log in
            </Link>
          )}
        </div>

        <div className="sm:hidden ml-auto">
          <AppHeaderMobile
            isAuthenticated={isAuth}
            seenCount={seenCount}
            totalBirds={totalBirds}
            userEmail={user?.email}
          />
        </div>
      </div>
    </header>
  );
}

function UserMenu({ email }: { email?: string }) {
  const initial = email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex items-center gap-2">
      <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0">
        <span className="font-heading text-[13px] font-bold text-primary-foreground leading-none">
          {initial}
        </span>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-foreground bg-transparent border-0 cursor-pointer p-1 hover:text-foreground transition-colors"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
