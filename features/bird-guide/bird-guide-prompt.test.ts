import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from './bird-guide-prompt';
import {
  MAX_CONTEXT_SPECIES,
  MAX_CONTEXT_SIGHTINGS,
  MAX_CONTEXT_NOTE_CHARS,
} from './robin-limits';
import type { UserContext } from './bird-guide.types';

function sighting(date: string, notes: string | null = null) {
  return { date, seen: true, heard: false, photographed: false, quality: null, notes, locationName: null };
}

function contextWith(observations: UserContext['observations']): UserContext {
  return { observedCount: observations.length, collectedCount: 0, totalBirdsInCatalog: 100, observations };
}

describe('buildSystemPrompt user context', () => {
  it('keeps only the most recently observed species', () => {
    const observations = Array.from({ length: MAX_CONTEXT_SPECIES + 5 }, (_, i) => ({
      name: `Bird ${String(i).padStart(2, '0')}`,
      sightings: [sighting(`2026-01-${String((i % 28) + 1).padStart(2, '0')}`)],
    }));
    observations.push({ name: 'Newest Bird', sightings: [sighting('2026-12-31')] });

    const prompt = buildSystemPrompt(contextWith(observations));

    expect(prompt).toContain('Newest Bird');
    expect(prompt.match(/^ {2}- /gm)).toHaveLength(MAX_CONTEXT_SPECIES);
  });

  it('keeps only the latest sightings per species', () => {
    const sightings = Array.from({ length: MAX_CONTEXT_SIGHTINGS + 3 }, (_, i) =>
      sighting(`2026-03-${String(20 - i).padStart(2, '0')}`),
    );

    const prompt = buildSystemPrompt(contextWith([{ name: 'Robin', sightings }]));

    expect(prompt.match(/^ {4}· /gm)).toHaveLength(MAX_CONTEXT_SIGHTINGS);
    expect(prompt).toContain('2026-03-20');
    expect(prompt).not.toContain('2026-03-12');
  });

  it('truncates long notes', () => {
    const longNote = 'x'.repeat(MAX_CONTEXT_NOTE_CHARS + 50);

    const prompt = buildSystemPrompt(contextWith([{ name: 'Robin', sightings: [sighting('2026-03-01', longNote)] }]));

    expect(prompt).toContain('x'.repeat(MAX_CONTEXT_NOTE_CHARS));
    expect(prompt).not.toContain('x'.repeat(MAX_CONTEXT_NOTE_CHARS + 1));
  });
});
