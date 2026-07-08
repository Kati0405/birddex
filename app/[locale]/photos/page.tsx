import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireAuth } from '@/features/auth/auth-helpers';
import { getUserObservationPhotos } from '@/features/observations/observation-queries';
import PhotoGallery from '@/features/observations/components/PhotoGallery/PhotoGallery';
import { locales, type Locale } from '@/i18n/locales';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('PhotosPage');

  await requireAuth();
  const photos = await getUserObservationPhotos();

  return (
    <main className="min-h-screen bg-background">
      <div className="px-4 md:px-6 py-5">
        <p className="mb-4 text-[10px] text-muted-foreground tracking-widest uppercase font-mono">
          {photos.length === 0
            ? t('noPhotosYet')
            : t('photoCount', { count: photos.length })}
        </p>
        <PhotoGallery photos={photos} />
      </div>
    </main>
  );
}
