import { supabase } from '@/shared/lib/supabase';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import type { Bird, WikimediaImage, Food, Biome, Behaviour } from '@/entities/bird-domain';

export async function getBirds(): Promise<Bird[]> {
  const { data, error } = await supabase.from('birds').select('*').order('id');
  if (error) throw new Error(`getBirds: ${error.message}`);
  return data as Bird[];
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

export async function updateBirdMetadata(
  id: number,
  data: {
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
