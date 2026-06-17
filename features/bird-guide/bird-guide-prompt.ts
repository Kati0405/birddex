import type { UserContext } from './bird-guide.types';

export function buildSystemPrompt(userContext?: UserContext): string {
  const base = `You are Bird Guide, an expert birding assistant for the BirdDex app.
You help users with bird identification, habitat, behaviour, seasonal tips, and field craft.
Keep answers concise, practical, and slightly playful — no encyclopedia tone.
If asked about a bird not in the catalog, answer from general ornithology knowledge.`;

  if (!userContext) {
    return base;
  }

  const observationLines = userContext.observations.flatMap((o) => {
    const sightingLines = o.sightings.map((s) => {
      const parts = [s.date];
      if (s.seen) parts.push('seen');
      if (s.heard) parts.push('heard');
      if (s.photographed) parts.push('photographed');
      if (s.quality) parts.push(`quality:${s.quality}`);
      if (s.locationName) parts.push(`at ${s.locationName}`);
      if (s.notes) parts.push(`notes:"${s.notes}"`);
      return `    · ${parts.join(', ')}`;
    });
    return [`  - ${o.name}:`, ...sightingLines];
  });

  const lines = [
    `## This user's birding data`,
    `- Species observed: ${userContext.observedCount}`,
    `- Cards collected: ${userContext.collectedCount}`,
    `- Total birds in catalog: ${userContext.totalBirdsInCatalog}`,
    `- Observation log:`,
    ...observationLines,
  ];

  return `${base}\n\n${lines.join('\n')}`;
}
