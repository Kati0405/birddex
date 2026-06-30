'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createBird, getBirdByLatinName } from '@/features/birds/bird-queries';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { RARITIES, FOODS, BIOMES, BEHAVIOURS, type Rarity, type Food, type Biome, type Behaviour } from '@/entities/bird-domain';

const CreateBirdSchema = z.object({
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

type CreateBirdInput = z.infer<typeof CreateBirdSchema>;

export async function createBirdAction(input: CreateBirdInput) {
  await requireAdmin();
  const parsed = CreateBirdSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const existing = await getBirdByLatinName(parsed.data.name_latin);
  if (existing) return { error: `A bird with the Latin name "${parsed.data.name_latin}" already exists.` };

  let birdId: number;
  try {
    birdId = await createBird(parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }

  revalidatePath('/birds');
  redirect(`/birds/${birdId}/edit`);
}
