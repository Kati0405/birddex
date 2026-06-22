import { getBirds } from '@/features/birds/bird-queries';
import { getObservedBirdIds } from '@/features/observations/observation-queries';
import type { Bird, Rarity, Biome, Food, Behaviour } from '@/entities/bird-domain';
import type OpenAI from 'openai';

// ── Tool definitions (sent to OpenAI) ────────────────────────────────────────

export const ROBIN_TOOLS: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_birds',
      description:
        'Search the BirdDex catalog. Returns matching birds with key info (name, rarity, biomes, food, behaviour, wingspan). Use when the user asks about birds matching certain criteria.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Free-text search against English or Latin name (optional)',
          },
          rarity: {
            type: 'string',
            enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
            description: 'Filter by rarity',
          },
          biome: {
            type: 'string',
            enum: ['forest', 'wetlands', 'city', 'fields', 'rivers', 'mountains', 'coast', 'gardens'],
            description: 'Filter by habitat/biome',
          },
          food: {
            type: 'string',
            enum: ['insects', 'seeds', 'fish', 'rodents', 'berries', 'omnivore', 'scavenger'],
            description: 'Filter by food type',
          },
          behaviour: {
            type: 'string',
            enum: [
              'nocturnal', 'predator', 'songbird', 'mimic', 'flock bird',
              'urban survivor', 'fish hunter', 'secretive', 'territorial',
              'fast flyer', 'berry lover', 'forest ghost', 'feeder visitor',
            ],
            description: 'Filter by behaviour trait',
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_bird_details',
      description:
        'Get full details for a specific bird by name. Returns all fields including field marks, tips to find, signature behavior, difficulty, best months, and best time of day.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'English name of the bird (case-insensitive partial match)',
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_user_collection',
      description:
        'Get the current user\'s observation stats: how many species observed, which birds they haven\'t spotted yet, and their total observation count. Only works for signed-in users.',
      parameters: {
        type: 'object',
        properties: {
          show_unobserved: {
            type: 'boolean',
            description: 'If true, include a list of birds the user has NOT observed yet',
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
];

// ── Tool execution ───────────────────────────────────────────────────────────

function summarizeBird(bird: Bird): object {
  return {
    name: bird.name_eng,
    latin: bird.name_latin,
    rarity: bird.rarity,
    biomes: bird.biomes,
    food: bird.food,
    behaviour: bird.behaviour,
    wingspan: bird.wingspan,
    field_note: bird.field_note,
  };
}

function fullBirdDetails(bird: Bird): object {
  return {
    ...summarizeBird(bird),
    best_months: bird.best_months,
    tips_to_find: bird.tips_to_find,
    field_marks: bird.field_marks,
    difficulty: bird.difficulty ?? null,
    best_time_of_day: bird.best_time_of_day ?? null,
    signature_behavior: bird.signature_behavior ?? null,
  };
}

interface SearchArgs {
  query?: string;
  rarity?: Rarity;
  biome?: Biome;
  food?: Food;
  behaviour?: Behaviour;
}

async function searchBirds(args: SearchArgs): Promise<string> {
  let birds = await getBirds();

  if (args.query) {
    const q = args.query.toLowerCase();
    birds = birds.filter(
      (b) =>
        b.name_eng.toLowerCase().includes(q) ||
        b.name_latin.toLowerCase().includes(q),
    );
  }
  if (args.rarity) {
    birds = birds.filter((b) => b.rarity === args.rarity);
  }
  if (args.biome) {
    birds = birds.filter((b) => b.biomes.includes(args.biome!));
  }
  if (args.food) {
    birds = birds.filter((b) => b.food.includes(args.food!));
  }
  if (args.behaviour) {
    birds = birds.filter((b) => b.behaviour.includes(args.behaviour!));
  }

  if (birds.length === 0) {
    return JSON.stringify({ results: [], message: 'No birds match those filters.' });
  }

  const capped = birds.slice(0, 15);
  return JSON.stringify({
    total: birds.length,
    showing: capped.length,
    results: capped.map(summarizeBird),
  });
}

async function getBirdDetails(args: { name: string }): Promise<string> {
  const birds = await getBirds();
  const q = args.name.toLowerCase();
  const match = birds.find(
    (b) =>
      b.name_eng.toLowerCase() === q ||
      b.name_eng.toLowerCase().includes(q),
  );

  if (!match) {
    return JSON.stringify({ error: `No bird found matching "${args.name}".` });
  }

  return JSON.stringify(fullBirdDetails(match));
}

async function getUserCollection(
  userId: string | null,
  args: { show_unobserved?: boolean },
): Promise<string> {
  if (!userId) {
    return JSON.stringify({ error: 'User is not signed in. Cannot access collection data.' });
  }

  const [observedIds, allBirds] = await Promise.all([
    getObservedBirdIds(userId),
    getBirds(),
  ]);

  const result: Record<string, unknown> = {
    total_in_catalog: allBirds.length,
    observed_count: observedIds.length,
    unobserved_count: allBirds.length - observedIds.length,
  };

  if (args.show_unobserved) {
    const observedSet = new Set(observedIds);
    const unobserved = allBirds
      .filter((b) => !observedSet.has(b.id))
      .slice(0, 20)
      .map((b) => ({ name: b.name_eng, rarity: b.rarity }));
    result.unobserved_birds = unobserved;
    if (allBirds.length - observedIds.length > 20) {
      result.note = 'Showing first 20 unobserved birds only.';
    }
  }

  return JSON.stringify(result);
}

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  userId: string | null,
): Promise<string> {
  switch (toolName) {
    case 'search_birds':
      return searchBirds(args as SearchArgs);
    case 'get_bird_details':
      return getBirdDetails(args as { name: string });
    case 'get_user_collection':
      return getUserCollection(userId, args as { show_unobserved?: boolean });
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}
