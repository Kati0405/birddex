import { redirect } from 'next/navigation';
import { getUser } from '@/features/auth/auth-helpers';
import { getBirds } from '@/features/birds/bird-queries';
import { pickBirdsForCurrentMonth } from '@/features/landing/landing-birds';
import LandingHero from '@/features/landing/components/LandingHero';
import LandingFeaturedBirds from '@/features/landing/components/LandingFeaturedBirds';
import LandingCta from '@/features/landing/components/LandingCta';
import LandingBackdrop from '@/features/landing/components/LandingBackdrop';

export default async function Home() {
  const user = await getUser();
  if (user) redirect('/birds');

  const birds = await getBirds();
  const featuredBirds = pickBirdsForCurrentMonth(birds, 6);

  return (
    <main className="flex-1">
      <LandingHero totalBirds={birds.length} />
      <LandingBackdrop>
        <LandingFeaturedBirds birds={featuredBirds} />
        <LandingCta birds={featuredBirds} />
      </LandingBackdrop>
    </main>
  );
}
