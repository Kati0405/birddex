import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { getPublicObservationShareData } from '@/features/observations/public-share-queries';
import SharedObservationCard from '@/features/observations/components/SharedObservationCard/SharedObservationCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}): Promise<Metadata> {
  const { shareSlug } = await params;
  const data = await getPublicObservationShareData(shareSlug);
  if (!data) return { title: 'Observation not found — birds.in.ua' };

  return {
    title: `${data.birdName} — birds.in.ua`,
    description: `Spotted ${format(new Date(data.observedAt), 'd MMM yyyy')}${data.location.displayName ? ` in ${data.location.displayName}` : ''}.`,
    robots: { index: false, follow: false },
  };
}

export default async function SharedObservationPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;
  const data = await getPublicObservationShareData(shareSlug);
  if (!data) notFound();

  return (
    <main className='min-h-screen bg-background px-4 py-12 sm:px-8'>
      <div className='mx-auto max-w-md'>
        <SharedObservationCard data={data} />
      </div>
    </main>
  );
}
