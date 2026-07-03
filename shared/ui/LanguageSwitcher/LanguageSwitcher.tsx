'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales, defaultLocale, type Locale } from '@/i18n/locales';
import { cn } from '@/shared/lib/cn';

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  uk: 'UA',
};

function splitLocaleFromPathname(pathname: string): { locale: Locale | null; rest: string } {
  const [, first, ...restParts] = pathname.split('/');
  if (locales.includes(first as Locale)) {
    return { locale: first as Locale, rest: `/${restParts.join('/')}` };
  }
  return { locale: null, rest: pathname };
}

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const { locale: activeLocale, rest } = splitLocaleFromPathname(pathname);

  return (
    <nav aria-label="Language" className="flex items-center gap-1 text-xs font-mono">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={activeLocale ? `/${locale}${rest === '/' ? '' : rest}` : `/${locale}`}
          aria-current={locale === (activeLocale ?? defaultLocale) ? 'true' : undefined}
          className={cn(
            'px-1.5 py-0.5 rounded uppercase tracking-wider transition-colors',
            locale === (activeLocale ?? defaultLocale)
              ? 'bg-foreground/10 text-foreground'
              : 'text-foreground/50 hover:text-foreground',
          )}
        >
          {localeLabels[locale]}
        </Link>
      ))}
    </nav>
  );
}
