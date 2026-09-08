import Link from 'next/link';
import Image from 'next/image';
import SocialIcon from '@/shared/ui/SiteFooter/SocialIcon';
import { getUser } from '@/features/auth/auth-helpers';

const SOCIAL_LINKS = [
  { href: 'https://www.instagram.com/birds_in_ua/', label: 'Instagram', src: '/social/instagram.png' },
  { href: 'https://www.youtube.com/', label: 'YouTube', src: '/social/youtube.png' },
  { href: 'https://www.facebook.com/', label: 'Facebook', src: '/social/facebook.png' },
];

export default async function SiteFooter() {
  const user = await getUser();
  const isAuthenticated = !!user;

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)] py-5 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-8">
        <Link href="/" aria-label="birds.in.ua" className="flex items-center gap-3 no-underline shrink-0">
          <Image
            src="/logo/birds-in-ua-horizontal.svg"
            alt="birds.in.ua"
            width={140}
            height={50}
            className="h-8 w-auto"
          />
          <span className="hidden md:block w-px h-8 bg-border shrink-0" />
          <span className="hidden md:block font-sans text-xs leading-tight text-muted-foreground">
            Your birding journal
            <br />
            for a wilder Ukraine.
          </span>
        </Link>

        <nav
          aria-label="Footer"
          className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.1em]"
        >
          <FooterLink href="/birds" label="Birds" />
          <FooterLink href="/ask-robin" label="Ask Robin" />
          {isAuthenticated && <FooterLink href="/observations" label="Observations" />}
          {isAuthenticated && <FooterLink href="/locations" label="Locations" />}
        </nav>

        <div className="flex items-center gap-5 shrink-0">
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map(({ href, label, src }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`birds.in.ua on ${label}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <SocialIcon src={src} size={16} />
              </a>
            ))}
          </div>
          <span className="hidden md:block w-px h-8 bg-border shrink-0" />
          <p className="font-mono text-[11px] text-muted-foreground tracking-[0.05em] whitespace-nowrap">
            {`© ${new Date().getFullYear()} birds.in.ua`}&nbsp;&nbsp; All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground no-underline transition-colors"
    >
      {label}
    </Link>
  );
}
