import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import { requireAuth } from '@/features/auth/auth-helpers';

export interface SavedLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export async function getSavedLocations(): Promise<SavedLocation[]> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('saved_locations')
    .select('id, name, lat, lng')
    .eq('user_id', user.id)
    .order('name');
  return (data ?? []) as SavedLocation[];
}

export async function saveLocation(name: string, lat: number, lng: number): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  await supabase.from('saved_locations').insert({ user_id: user.id, name, lat, lng });
}

export async function deleteLocation(id: number): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from('saved_locations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
}
