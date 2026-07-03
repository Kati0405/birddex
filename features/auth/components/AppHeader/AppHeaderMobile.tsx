'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/shared/lib/cn';
import { logoutAction } from '@/app/[locale]/(auth)/actions';
import AdminBadge from '@/shared/ui/AdminBadge/AdminBadge';

type Props = {
  isAuthenticated: boolean;
  isAdmin?: boolean;
  seenCount?: number;
  totalBirds?: number;
  userEmail?: string;
};

export default function AppHeaderMobile({ isAuthenticated, isAdmin, seenCount, totalBirds, userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const currentPath = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        className="flex flex-col justify-center gap-[5px] w-9 h-9 p-1.5 bg-transparent border-0 cursor-pointer"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'block h-[1.5px] bg-foreground rounded-sm transition-opacity',
              i === 1 ? 'w-[60%]' : 'w-full',
            )}
          />
        ))}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
          />
          <nav className="fixed top-0 right-0 bottom-0 w-[min(280px,80vw)] z-50 bg-card border-l border-border flex flex-col pt-12 px-8 pb-8 gap-1 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 bg-transparent border-0 cursor-pointer text-muted-foreground text-xl leading-none p-1"
            >
              ×
            </button>

            <MobileNavLink href="/birds" label="Birds" active={currentPath === '/birds'} onClick={() => setOpen(false)} />
            {isAuthenticated && (
              <MobileNavLink href="/observations" label="My Observations" active={currentPath === '/observations'} onClick={() => setOpen(false)} />
            )}
            {isAuthenticated && (
              <MobileNavLink href="/locations" label="My Locations" active={currentPath === '/locations'} onClick={() => setOpen(false)} />
            )}
            {isAuthenticated && (
              <MobileNavLink href="/photos" label="My Photos" active={currentPath === '/photos'} onClick={() => setOpen(false)} />
            )}
            <MobileNavLink href="/ask-robin" label="Ask Robin" active={currentPath === '/ask-robin'} onClick={() => setOpen(false)} />
            {isAdmin && (
              <MobileNavLink href="/admin/add-bird" label="Add Bird" active={currentPath === '/admin/add-bird'} onClick={() => setOpen(false)} adminBadge />
            )}

            {isAuthenticated && seenCount !== undefined && totalBirds !== undefined && (
              <div className="mt-4 px-4 py-3 bg-secondary rounded-lg font-mono text-[11px] text-primary tracking-wide">
                Seen {seenCount} / {totalBirds}
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-border">
              {isAuthenticated ? (
                <>
                  {userEmail && (
                    <div className="font-mono text-[10px] text-muted-foreground mb-3 truncate flex items-center gap-1.5">
                      <span className="truncate">{userEmail}</span>
                      {isAdmin && <AdminBadge variant="pill" />}
                    </div>
                  )}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground bg-transparent border-0 cursor-pointer p-0 hover:text-foreground transition-colors"
                    >
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-block font-mono text-[10px] tracking-[0.15em] uppercase text-primary-foreground bg-primary px-5 py-2.5 rounded-md no-underline"
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

function MobileNavLink({ href, label, active, onClick, adminBadge }: { href: string; label: string; active: boolean; onClick: () => void; adminBadge?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 font-heading text-[1.15rem] no-underline py-2.5 border-b border-border tracking-[-0.01em]',
        active ? 'font-bold text-foreground' : 'font-normal text-muted-foreground',
      )}
    >
      {label}
      {adminBadge && <AdminBadge variant="pill" />}
    </Link>
  );
}
