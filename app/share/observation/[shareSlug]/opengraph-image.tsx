import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import { getPublicObservationShareData } from '@/features/observations/public-share-queries';
import ShareCard from '@/features/observations/components/ShareCard/ShareCard';

export const alt = 'Bird observation shared from birds.in.ua';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ shareSlug: string }> }) {
  const { shareSlug } = await params;
  const [data, headerStore] = await Promise.all([getPublicObservationShareData(shareSlug), headers()]);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? headerStore.get('origin') ?? 'http://localhost:3000';

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#faf6ed',
            fontSize: 48,
            color: '#6b6558',
          }}
        >
          birds.in.ua
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(<ShareCard data={data} size='og' origin={origin} />, size);
}
