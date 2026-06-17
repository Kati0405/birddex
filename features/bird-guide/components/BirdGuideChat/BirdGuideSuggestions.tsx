'use client';

import type { UserContext } from '@/features/bird-guide/bird-guide.types';

interface Props {
  userContext: UserContext | null;
  onSuggest: (question: string) => void;
}

const GENERAL_QUESTIONS = [
  'How do I identify a bird by its song?',
  'What birds are easiest to spot for beginners?',
  'How can I attract birds to my garden?',
  "What's the best time of day to go birdwatching?",
];

function getPersonalizedQuestions(ctx: UserContext): string[] {
  const questions: string[] = [];

  const mostPhotographed = ctx.observations
    .filter((o) => o.sightings.some((s) => s.photographed))
    .sort(
      (a, b) =>
        b.sightings.filter((s) => s.photographed).length -
        a.sightings.filter((s) => s.photographed).length,
    )[0];

  if (mostPhotographed) {
    questions.push(`What's interesting about the ${mostPhotographed.name}?`);
  }

  const winterBirds = ctx.observations.filter((o) =>
    o.sightings.some((s) => {
      const month = new Date(s.date).getMonth() + 1;
      return month === 12 || month === 1 || month === 2;
    }),
  );
  if (winterBirds.length > 0) {
    questions.push('Which birds have I spotted in winter?');
  }

  const summerBirds = ctx.observations.filter((o) =>
    o.sightings.some((s) => {
      const month = new Date(s.date).getMonth() + 1;
      return month >= 6 && month <= 8;
    }),
  );
  if (summerBirds.length > 0) {
    questions.push('Which birds have I seen in summer?');
  }

  const heardOnly = ctx.observations.filter((o) =>
    o.sightings.every((s) => !s.seen && s.heard),
  );
  if (heardOnly.length > 0) {
    questions.push(`I've only heard the ${heardOnly[0].name} — how do I spot one?`);
  }

  if (ctx.observedCount > 0) {
    questions.push(`How many birds have I observed so far?`);
  }

  return questions.slice(0, 4);
}

export default function BirdGuideSuggestions({ userContext, onSuggest }: Props) {
  const questions =
    userContext && userContext.observedCount > 0
      ? getPersonalizedQuestions(userContext)
      : GENERAL_QUESTIONS;

  return (
    <div className="flex flex-col gap-2 px-1">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSuggest(q)}
          className="text-left text-sm text-muted-foreground border border-border rounded-xl px-3 py-2 hover:bg-secondary hover:text-foreground transition-colors"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
