import { getObservedBirdIds, getCollectionCardDataByBirdIds } from '@/features/observations/observation-queries';
import { getCollectedCount } from '@/features/collection/collection-queries';
import { getBirdsByIds, getBirdCount } from '@/features/birds/bird-queries';
import type { UserContext, ObservedBirdEntry } from './bird-guide.types';

export async function buildUserContext(userId: string): Promise<UserContext> {
  const [observedBirdIds, collectedCount, totalBirdsInCatalog] = await Promise.all([
    getObservedBirdIds(userId),
    getCollectedCount(userId),
    getBirdCount(),
  ]);

  if (observedBirdIds.length === 0) {
    return {
      observedCount: 0,
      collectedCount,
      totalBirdsInCatalog,
      observations: [],
    };
  }

  const [cardData, observedBirds] = await Promise.all([
    getCollectionCardDataByBirdIds(userId, observedBirdIds),
    getBirdsByIds(observedBirdIds),
  ]);

  const nameById: Record<number, string> = {};
  for (const bird of observedBirds) {
    nameById[bird.id] = bird.name_eng;
  }

  const observations: ObservedBirdEntry[] = observedBirdIds.map((birdId) => {
    const card = cardData[birdId];
    return {
      name: nameById[birdId] ?? `Bird #${birdId}`,
      sightings: (card?.observations ?? []).map((o) => ({
        date: o.observedAt.slice(0, 10),
        seen: o.seen,
        heard: o.heard,
        photographed: o.photographed,
        quality: o.quality,
        notes: o.notes,
        locationName: o.locationName,
      })),
    };
  });

  return {
    observedCount: observedBirdIds.length,
    collectedCount,
    totalBirdsInCatalog,
    observations,
  };
}
