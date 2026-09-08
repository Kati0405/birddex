import type { Bird } from '@/entities/bird-domain';

export function pickBirdsForCurrentMonth(birds: Bird[], count: number, now = new Date()): Bird[] {
  const month = now.getMonth() + 1;
  const inSeason = birds.filter((bird) => bird.best_months.includes(month));

  if (inSeason.length >= count) return inSeason.slice(0, count);

  const rest = birds.filter((bird) => !bird.best_months.includes(month));
  return [...inSeason, ...rest].slice(0, count);
}
