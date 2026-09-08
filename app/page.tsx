import { getUser } from '@/features/auth/auth-helpers';
import { getBirds } from '@/features/birds/bird-queries';
import { pickBirdsForCurrentMonth } from '@/features/landing/landing-birds';
import LandingHero from '@/features/landing/components/LandingHero';
import LandingFeaturedBirds from '@/features/landing/components/LandingFeaturedBirds';
import LandingCta from '@/features/landing/components/LandingCta';
import LandingBackdrop from '@/features/landing/components/LandingBackdrop';
import { getObservedBirdIds, getObservationCount, getAllUserObservations } from '@/features/observations/observation-queries';
import { RARITIES } from '@/entities/bird-domain';
import { getSavedLocations } from '@/features/locations/location-queries';
import { pickUncollectedBirds, pickRareUncollectedBird, pickBirdOfTheDay } from '@/features/dashboard/dashboard-birds';
import DashboardPage from '@/features/dashboard/components/DashboardPage/DashboardPage';

export default async function Home() {
  const user = await getUser();
  const birds = await getBirds();

  if (!user) {
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

  const [observedIds, observedCount, savedLocations, recentObservations] = await Promise.all([
    getObservedBirdIds(user.id),
    getObservationCount(user.id),
    getSavedLocations(user.id),
    getAllUserObservations(),
  ]);

  const userName = user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'there';
  const photoCount = new Set(recentObservations.filter((o) => o.photoUrl).map((o) => o.birdId)).size;

  const encountersByBird = new Map<number, { observation: (typeof recentObservations)[number]; count: number }>();
  for (const o of recentObservations) {
    const entry = encountersByBird.get(o.birdId);
    if (entry) {
      entry.count += 1;
    } else {
      encountersByBird.set(o.birdId, { observation: o, count: 1 });
    }
  }
  const rarestFind = [...encountersByBird.values()].reduce<
    { observation: (typeof recentObservations)[number]; count: number } | null
  >((rarest, entry) => {
    if (!rarest) return entry;
    const entryRank = RARITIES.indexOf(entry.observation.birdRarity as (typeof RARITIES)[number]);
    const rarestRank = RARITIES.indexOf(rarest.observation.birdRarity as (typeof RARITIES)[number]);
    if (entryRank !== rarestRank) return entryRank > rarestRank ? entry : rarest;
    return entry.count < rarest.count ? entry : rarest;
  }, null);

  return (
    <DashboardPage
      userName={userName}
      savedLocations={savedLocations}
      observedCount={observedCount}
      totalBirdCount={birds.length}
      photoCount={photoCount}
      observationCount={recentObservations.length}
      savedLocationCount={savedLocations.length}
      rarestFind={rarestFind?.observation ?? null}
      latestObservation={recentObservations[0] ?? null}
      birdOfTheDay={pickBirdOfTheDay(birds)}
      uncollectedBirds={pickUncollectedBirds(birds, observedIds, 8)}
      rareUncollectedBird={pickRareUncollectedBird(birds, observedIds)}
      recentObservations={recentObservations.slice(0, 4)}
    />
  );
}
