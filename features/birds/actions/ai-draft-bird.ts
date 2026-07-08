'use server';

import { z } from 'zod';
import OpenAI from 'openai';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { RARITIES, FOODS, BIOMES, BEHAVIOURS, type Rarity, type Food, type Biome, type Behaviour } from '@/entities/bird-domain';
import { localizedZodMessage } from '@/shared/lib/zod-locale';

const DraftBirdSchema = z.object({
  name_eng: z.string().min(1).max(100),
  name_latin: z.string().min(1).max(100),
  rarity: z.enum(RARITIES as [Rarity, ...Rarity[]]),
  food: z.array(z.enum(FOODS as [Food, ...Food[]])).min(1).max(3),
  biomes: z.array(z.enum(BIOMES as [Biome, ...Biome[]])).min(1).max(3),
  behaviour: z.array(z.enum(BEHAVIOURS as [Behaviour, ...Behaviour[]])).min(1).max(3),
  wingspan: z.number().positive(),
  best_months: z.array(z.number().int().min(1).max(12)),
  field_note: z.string().max(300),
  tips_to_find: z.array(z.string().max(200)).max(4),
  field_marks: z.array(z.string().max(200)).max(4),
});

export type DraftedBird = z.infer<typeof DraftBirdSchema>;

const DraftBirdQuerySchema = z.object({
  query: z.string().min(1).max(100),
});

type DraftBirdQueryInput = z.infer<typeof DraftBirdQuerySchema>;

const DRAFT_BIRD_TOOL: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'draft_bird_card',
    description: 'Draft a BirdDex catalog card for a real bird species identified from the user query.',
    strict: true,
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name_eng: { type: 'string', description: 'Common English name of the species.' },
        name_latin: { type: 'string', description: 'Scientific (binomial Latin) name.' },
        rarity: { type: 'string', enum: RARITIES },
        food: {
          type: 'array',
          items: { type: 'string', enum: FOODS },
          minItems: 1,
          maxItems: 3,
        },
        biomes: {
          type: 'array',
          items: { type: 'string', enum: BIOMES },
          minItems: 1,
          maxItems: 3,
        },
        behaviour: {
          type: 'array',
          items: { type: 'string', enum: BEHAVIOURS },
          minItems: 1,
          maxItems: 3,
        },
        wingspan: { type: 'number', description: 'Average wingspan in cm, a single precise number (not a range).' },
        best_months: {
          type: 'array',
          items: { type: 'integer', minimum: 1, maximum: 12 },
          description: 'Best months (1-12) to observe this species.',
        },
        field_note: {
          type: 'string',
          description: 'Short, funny, dry field note. No encyclopedia tone, no Disney-cute language, max 300 chars.',
        },
        tips_to_find: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 4,
          description: 'Short practical tips for finding this bird in the field.',
        },
        field_marks: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 4,
          description: 'Short distinguishing visual field marks.',
        },
      },
      required: [
        'name_eng', 'name_latin', 'rarity', 'food', 'biomes', 'behaviour',
        'wingspan', 'best_months', 'field_note', 'tips_to_find', 'field_marks',
      ],
    },
  },
};

const SYSTEM_PROMPT = `You identify real bird species from a short user query and draft a BirdDex catalog card by calling draft_bird_card exactly once.

Rules:
- Only draft species that are real, identifiable birds. If the query is too vague, nonsensical, or not a bird, do not call the tool — instead reply with plain text explaining you could not identify a bird.
- field_note must be short, funny, slightly unhinged, and dry — never generic encyclopedia tone, never "majestic creature of the skies" language, never long jokes.
- wingspan must be your best single estimate in cm, not a range.
- rarity reflects how common/easy to spot the bird is for an average birdwatcher (Common = everyday backyard bird, Legendary = extremely rare/hard to see).
- Pick 1-3 of the most relevant food, biomes, and behaviour values only — do not pad with marginal ones.`;

export async function draftBirdAction(
  input: DraftBirdQueryInput,
): Promise<{ draft: DraftedBird } | { error: string }> {
  await requireAdmin();

  if (!process.env.OPENAI_API_KEY) {
    return { error: 'AI drafting is not configured.' };
  }

  const parsed = DraftBirdQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { error: await localizedZodMessage(parsed.error) };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let response;
  try {
    response = await client.chat.completions.create({
      model: 'gpt-5.4-mini',
      tools: [DRAFT_BIRD_TOOL],
      tool_choice: 'auto',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: parsed.data.query },
      ],
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'AI request failed.' };
  }

  const message = response.choices[0]?.message;
  const toolCall = message?.tool_calls?.[0];

  if (!toolCall || toolCall.type !== 'function') {
    return { error: message?.content || 'Could not identify a bird from that query.' };
  }

  let rawArgs: unknown;
  try {
    rawArgs = JSON.parse(toolCall.function.arguments);
  } catch {
    return { error: 'AI returned malformed data.' };
  }

  const draftParsed = DraftBirdSchema.safeParse(rawArgs);
  if (!draftParsed.success) {
    return { error: `AI draft failed validation: ${await localizedZodMessage(draftParsed.error)}` };
  }

  return { draft: draftParsed.data };
}
