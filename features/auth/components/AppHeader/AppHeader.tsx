import Link from 'next/link';
import { Bird } from 'lucide-react';
import { getUser, getUserRole } from '@/features/auth/auth-helpers';
import AdminBadge from '@/shared/ui/AdminBadge/AdminBadge';
import { getBirds } from '@/features/birds/bird-queries';
import { getObservationCount } from '@/features/observations/observation-queries';
import { getSavedLocations } from '@/features/locations/location-queries';
import { logoutAction } from '@/app/(auth)/actions';
import AppHeaderMobile from './AppHeaderMobile';
import AppHeaderNav from './AppHeaderNav';
import QuickAddObservationButton from '@/features/observations/components/QuickAddObservation/QuickAddObservationButton';

export default async function AppHeader() {
  const [user, birds, role] = await Promise.all([getUser(), getBirds(), getUserRole()]);
  const [seenCount, savedLocations] = await Promise.all([
    user ? getObservationCount(user.id) : Promise.resolve(undefined),
    user ? getSavedLocations(user.id) : Promise.resolve([]),
  ]);
  const totalBirds = birds.length;
  const isAuth = !!user;
  const isAdmin = role === 'admin';

  return (
    <header className="sticky top-0 z-[100] bg-card border-b border-border shadow-[0_1px_12px_rgba(20,32,12,0.06)]">
      <div className="h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

      <div className="max-w-[1280px] mx-auto px-3 sm:px-[clamp(1rem,4vw,3rem)] h-[60px] flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <Bird size={22} className="text-primary" aria-hidden="true" />

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

        <AppHeaderNav isAuthenticated={isAuth} isAdmin={isAdmin} />

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
              <QuickAddObservationButton savedLocations={savedLocations} />
              <UserMenu email={user?.email} avatarUrl={user?.user_metadata?.avatar_url} isAdmin={isAdmin} />
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

        <div className="sm:hidden ml-auto flex items-center gap-2">
          {isAuth && <QuickAddObservationButton savedLocations={savedLocations} />}
          <AppHeaderMobile
            isAuthenticated={isAuth}
            isAdmin={isAdmin}
            seenCount={seenCount}
            totalBirds={totalBirds}
            userEmail={user?.email}
          />
        </div>
      </div>
    </header>
  );
}

function UserMenu({ email, avatarUrl, isAdmin }: { email?: string; avatarUrl?: string; isAdmin: boolean }) {
  const initial = email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarUrl}
            alt=""
            width={30}
            height={30}
            className="w-[30px] h-[30px] rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0">
            <span className="font-heading text-[13px] font-bold text-primary-foreground leading-none">
              {initial}
            </span>
          </div>
        )}
        {isAdmin && <AdminBadge className="absolute -top-1 -right-1 border-2 border-card" />}
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
