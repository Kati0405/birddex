import type { Bird } from '@/entities/bird-domain';
import { RARITIES } from '@/entities/bird-domain';

const RARITY_ORDER = Object.fromEntries(RARITIES.map((r, i) => [r, i]));

/** Uncollected birds, easier rarities first, for the "Easy to spot" section. */
export function pickUncollectedBirds(birds: Bird[], collectedIds: number[], count: number): Bird[] {
  const collected = new Set(collectedIds);
  return birds
    .filter((bird) => !collected.has(bird.id))
    .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity])
    .slice(0, count);
}

/** An uncollected Epic or Legendary bird for the "Worth the search" section. */
export function pickRareUncollectedBird(birds: Bird[], collectedIds: number[]): Bird | null {
  const collected = new Set(collectedIds);
  const candidates = birds
    .filter((bird) => !collected.has(bird.id) && (bird.rarity === 'Epic' || bird.rarity === 'Legendary'))
    .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
  return candidates[0] ?? null;
}

/** Deterministic "bird of the day" — stable for the calendar day, cycles through the catalog. */
export function pickBirdOfTheDay(birds: Bird[], now = new Date()): Bird | null {
  if (birds.length === 0) return null;
  const dayStart = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dayNumber = Math.floor(dayStart / 86_400_000);
  return birds[dayNumber % birds.length];
}
