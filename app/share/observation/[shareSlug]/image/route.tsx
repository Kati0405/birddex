import { ImageResponse } from 'next/og';
import { getPublicObservationShareData } from '@/features/observations/public-share-queries';
import ShareCard from '@/features/observations/components/ShareCard/ShareCard';

export const revalidate = 3600;

const SIZE = { width: 1080, height: 1350 };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareSlug: string }> },
) {
  const { shareSlug } = await params;
  const data = await getPublicObservationShareData(shareSlug);

  if (!data) {
    return new Response('Not found', { status: 404 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  return new ImageResponse(<ShareCard data={data} size='4:5' origin={origin} />, SIZE);
}
