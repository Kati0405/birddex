import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import { requireAuth } from '@/features/auth/auth-helpers';

export interface SavedLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export async function getSavedLocations(userId: string): Promise<SavedLocation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('saved_locations')
    .select('id, name, lat, lng')
    .eq('user_id', userId)
    .order('name');
  if (error) throw new Error(`getSavedLocations: ${error.message}`);
  return (data ?? []) as SavedLocation[];
}

export async function saveLocation(name: string, lat: number, lng: number): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('saved_locations')
    .insert({ user_id: user.id, name, lat, lng });
  if (error) throw new Error(`saveLocation: ${error.message}`);
}

export async function deleteLocation(id: number): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('saved_locations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error(`deleteLocation(${id}): ${error.message}`);
}
