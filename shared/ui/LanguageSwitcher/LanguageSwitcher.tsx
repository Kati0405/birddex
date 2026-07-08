'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/locales';
import { cn } from '@/shared/lib/cn';

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  uk: 'UA',
};

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const activeLocale = useLocale();
  const t = useTranslations('Navigation');

  return (
    <nav aria-label={t('language')} className="flex items-center gap-1 text-xs font-mono">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          aria-current={locale === activeLocale ? 'true' : undefined}
          className={cn(
            'px-1.5 py-0.5 rounded uppercase tracking-wider transition-colors',
            locale === activeLocale
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
