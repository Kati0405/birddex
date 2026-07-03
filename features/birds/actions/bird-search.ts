'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import type { WikimediaImage } from '@/entities/bird-domain';

export interface BirdSearchResult {
  id: number;
  name_eng: string;
  name_latin: string;
  rarity: string;
  image_url: string | null;
  selected_image: WikimediaImage | null;
}

export async function getBirdsForSearch(): Promise<BirdSearchResult[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('birds')
    .select('id, name_eng, name_latin, rarity, image_url, selected_image')
    .order('name_eng');
  if (error) throw new Error(`getBirdsForSearch: ${error.message}`);
  return (data ?? []) as BirdSearchResult[];
}
