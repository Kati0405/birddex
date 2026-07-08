import { z, locales } from 'zod';
import { getLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/locales';

const errorMaps: Record<Locale, z.core.$ZodErrorMap> = {
  en: locales.en().localeError,
  uk: locales.uk().localeError,
};

/** Joined Zod issue messages in the current request's locale, without mutating global Zod config. */
export async function localizedZodMessage(error: z.ZodError): Promise<string> {
  const locale = (await getLocale()) as Locale;
  const errorMap = errorMaps[locale] ?? errorMaps.en;
  return error.issues
    .map((issue) => {
      const result = errorMap(issue as unknown as Parameters<typeof errorMap>[0]);
      if (typeof result === 'string') return result;
      return result?.message ?? issue.message;
    })
    .join(', ');
}
