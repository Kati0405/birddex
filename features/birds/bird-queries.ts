import { supabase } from '@/shared/lib/supabase';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import type { Bird, WikimediaImage, Food, Biome, Behaviour, Rarity } from '@/entities/bird-domain';

export async function getBirds(): Promise<Bird[]> {
  const { data, error } = await supabase.from('birds').select('*').order('id');
  if (error) throw new Error(`getBirds: ${error.message}`);
  return data as Bird[];
}

export async function getBirdCount(): Promise<number> {
  const { count, error } = await supabase
    .from('birds')
    .select('*', { count: 'exact', head: true });
  if (error) throw new Error(`getBirdCount: ${error.message}`);
  return count ?? 0;
}

export async function getBirdsByIds(ids: number[]): Promise<Bird[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('birds').select('*').in('id', ids).order('id');
  if (error) throw new Error(`getBirdsByIds: ${error.message}`);
  return data as Bird[];
}

export async function getBirdById(id: number): Promise<Bird | undefined> {
  const { data, error } = await supabase
    .from('birds')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return undefined;
    throw new Error(`getBirdById(${id}): ${error.message}`);
  }
  return data as Bird;
}

export async function updateBirdSelectedImage(id: number, img: WikimediaImage): Promise<void> {
  const { error } = await supabaseAdmin
    .from('birds')
    .update({ selected_image: img })
    .eq('id', id);
  if (error) throw new Error(`updateBirdSelectedImage(${id}): ${error.message}`);
}

export async function updateBirdCloudinaryImage(id: number, imageUrl: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('birds')
    .update({ image_url: imageUrl, selected_image: null })
    .eq('id', id);
  if (error) throw new Error(`updateBirdCloudinaryImage(${id}): ${error.message}`);
}

export async function updateBirdSoundUrl(id: number, soundUrl: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('birds')
    .update({ sound_url: soundUrl })
    .eq('id', id);
  if (error) throw new Error(`updateBirdSoundUrl(${id}): ${error.message}`);
}

export async function getBirdByLatinName(nameLatin: string): Promise<Bird | undefined> {
  const { data, error } = await supabase
    .from('birds')
    .select('*')
    .ilike('name_latin', nameLatin)
    .maybeSingle();
  if (error) throw new Error(`getBirdByLatinName: ${error.message}`);
  return (data as Bird) ?? undefined;
}

export class DuplicateBirdError extends Error {
  constructor(nameLatin: string) {
    super(`A bird with the Latin name "${nameLatin}" already exists.`);
    this.name = 'DuplicateBirdError';
  }
}

export async function createBird(data: Omit<Bird, 'id'>): Promise<number> {
  const { data: row, error } = await supabaseAdmin
    .from('birds')
    .insert(data)
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') throw new DuplicateBirdError(data.name_latin);
    throw new Error(`createBird: ${error.message}`);
  }
  return (row as { id: number }).id;
}

export class BirdHasObservationsError extends Error {
  constructor(id: number) {
    super(`Bird ${id} has existing observations and cannot be deleted.`);
    this.name = 'BirdHasObservationsError';
  }
}

export async function deleteBird(id: number): Promise<void> {
  const { error } = await supabaseAdmin.from('birds').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') throw new BirdHasObservationsError(id);
    throw new Error(`deleteBird(${id}): ${error.message}`);
  }
}

export async function updateBirdMetadata(
  id: number,
  data: {
    rarity?: Rarity;
    food?: Food[];
    biomes?: Biome[];
    behaviour?: Behaviour[];
    best_months?: number[];
    field_note?: string;
    tips_to_find?: string[];
    field_marks?: string[];
  }
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('birds')
    .update(data)
    .eq('id', id);
  if (error) throw new Error(`updateBirdMetadata(${id}): ${error.message}`);
}
