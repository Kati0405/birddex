import { requireAuth } from '@/features/auth/auth-helpers';
import { getUserObservationPhotos } from '@/features/observations/observation-queries';
import PhotoGallery from '@/features/observations/components/PhotoGallery/PhotoGallery';

export default async function PhotosPage() {
  await requireAuth();
  const photos = await getUserObservationPhotos();

  return (
    <main className="min-h-screen bg-background">
      <div className="px-4 md:px-6 py-5">
        <p className="mb-4 text-[10px] text-muted-foreground tracking-widest uppercase font-mono">
          {photos.length === 0
            ? 'No photos yet'
            : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`}
        </p>
        <PhotoGallery photos={photos} />
      </div>
    </main>
  );
}
