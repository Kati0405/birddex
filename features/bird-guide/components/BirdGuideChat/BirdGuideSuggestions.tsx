'use client';

import type { UserContext } from '@/features/bird-guide/bird-guide.types';

interface Props {
  userContext?: UserContext | null;
  isAuthenticated?: boolean;
  onSuggest: (question: string) => void;
}

const GENERAL_QUESTIONS = [
  'How do I identify a bird by its song?',
  'What birds are easiest to spot for beginners?',
  'How can I attract birds to my garden?',
  "What's the best time of day to go birdwatching?",
];

// Personal phrasings the AI answers from server-side context.
// These need no client data — safe to show whenever the user is logged in.
const AUTHENTICATED_QUESTIONS = [
  "What's my most photographed bird?",
  'Which birds have I spotted in winter?',
  'How many birds have I observed so far?',
  'Which birds have I only heard but never seen?',
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

  const hasWinter = ctx.observations.some((o) =>
    o.sightings.some((s) => {
      const month = new Date(s.date).getMonth() + 1;
      return month === 12 || month === 1 || month === 2;
    }),
  );
  if (hasWinter) questions.push('Which birds have I spotted in winter?');

  const hasSummer = ctx.observations.some((o) =>
    o.sightings.some((s) => {
      const month = new Date(s.date).getMonth() + 1;
      return month >= 6 && month <= 8;
    }),
  );
  if (hasSummer) questions.push('Which birds have I seen in summer?');

  const heardOnly = ctx.observations.find((o) =>
    o.sightings.every((s) => !s.seen && s.heard),
  );
  if (heardOnly) {
    questions.push(`I've only heard the ${heardOnly.name} — how do I spot one?`);
  }

  if (ctx.observedCount > 0) {
    questions.push('How many birds have I observed so far?');
  }

  return questions.slice(0, 4);
}

export default function BirdGuideSuggestions({ userContext, isAuthenticated, onSuggest }: Props) {
  let questions: string[];
  if (userContext && userContext.observedCount > 0) {
    questions = getPersonalizedQuestions(userContext);
  } else if (isAuthenticated) {
    questions = AUTHENTICATED_QUESTIONS;
  } else {
    questions = GENERAL_QUESTIONS;
  }

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
