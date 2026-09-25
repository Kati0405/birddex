import { requireAuth } from '@/features/auth/auth-helpers';
import { getUserObservationPhotos } from '@/features/observations/observation-queries';
import PhotoGallery from '@/features/observations/components/PhotoGallery/PhotoGallery';
import PageBackdrop from '@/shared/ui/PageBackdrop';
import PageHero from '@/shared/ui/PageHero';

export default async function PhotosPage() {
  await requireAuth();
  const photos = await getUserObservationPhotos();

  return (
    <PageBackdrop showUpper={false}>
      <div className='max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)] py-6 flex flex-col gap-5'>
        <PageHero
          title='My photos'
          subtitle='Every sighting, one gallery.'
          tagline={
            photos.length === 0
              ? 'No photos yet'
              : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`
          }
          bgImage='/hero/goldcrest_pine_wood_watercolor.png'
          birdImage=''
          textAlign='right'
        />
        <div className='rounded-2xl border border-border bg-card p-4 sm:p-6'>
          <PhotoGallery photos={photos} />
        </div>
      </div>
    </PageBackdrop>
  );
}
