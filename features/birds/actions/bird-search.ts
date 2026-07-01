'use server';

import { createSupabaseServerClient } from '@/shared/lib/supabase-server';

export interface BirdSearchResult {
  id: number;
  name_eng: string;
  name_latin: string;
  rarity: string;
  image_url: string | null;
}

export async function getBirdsForSearch(): Promise<BirdSearchResult[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('birds')
    .select('id, name_eng, name_latin, rarity, image_url')
    .order('name_eng');
  if (error) throw new Error(`getBirdsForSearch: ${error.message}`);
  return (data ?? []) as BirdSearchResult[];
}
