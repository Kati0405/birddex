import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import { requireAuth } from '@/features/auth/auth-helpers';
import type { Biome } from '@/entities/bird-domain';

export interface SavedLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
  photoPublicId: string | null;
  habitats: Biome[];
}

export async function getSavedLocations(userId: string): Promise<SavedLocation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('saved_locations')
    .select('id, name, lat, lng, photo_url, photo_public_id, habitats')
    .eq('user_id', userId)
    .order('name');
  if (error) throw new Error(`getSavedLocations: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id as number,
    name: r.name as string,
    lat: r.lat as number,
    lng: r.lng as number,
    photoUrl: (r.photo_url as string) ?? null,
    photoPublicId: (r.photo_public_id as string) ?? null,
    habitats: ((r.habitats as string[]) ?? []) as Biome[],
  }));
}

export async function getSavedLocationById(id: number): Promise<SavedLocation | null> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('saved_locations')
    .select('id, name, lat, lng, photo_url, photo_public_id, habitats')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (error || !data) return null;
  return {
    id: data.id as number,
    name: data.name as string,
    lat: data.lat as number,
    lng: data.lng as number,
    photoUrl: (data.photo_url as string) ?? null,
    photoPublicId: (data.photo_public_id as string) ?? null,
    habitats: ((data.habitats as string[]) ?? []) as Biome[],
  };
}

export async function saveLocation(
  name: string,
  lat: number,
  lng: number,
  photoUrl?: string | null,
  photoPublicId?: string | null,
  habitats?: string[],
): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('saved_locations')
    .insert({
      user_id: user.id,
      name,
      lat,
      lng,
      photo_url: photoUrl ?? null,
      photo_public_id: photoPublicId ?? null,
      habitats: habitats ?? [],
    });
  if (error) throw new Error(`saveLocation: ${error.message}`);
}

export async function updateLocationPhoto(
  id: number,
  photoUrl: string | null,
  photoPublicId: string | null,
): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('saved_locations')
    .update({ photo_url: photoUrl, photo_public_id: photoPublicId })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error(`updateLocationPhoto(${id}): ${error.message}`);
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

export interface LocationStats {
  observationCount: number;
  speciesCount: number;
}

export async function getLocationStats(
  userId: string,
  locationNames: string[],
): Promise<Record<string, LocationStats>> {
  if (locationNames.length === 0) return {};
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('observations')
    .select('location_name, bird_id')
    .eq('user_id', userId)
    .in('location_name', locationNames);

  const result: Record<string, LocationStats> = {};
  for (const row of data ?? []) {
    const name = row.location_name as string;
    if (!result[name]) result[name] = { observationCount: 0, speciesCount: 0 };
    result[name].observationCount++;
  }
  for (const name of Object.keys(result)) {
    const rows = (data ?? []).filter((r) => r.location_name === name);
    result[name].speciesCount = new Set(rows.map((r) => r.bird_id as number)).size;
  }
  return result;
}

export interface LocationDetailStats {
  observationCount: number;
  speciesCount: number;
  lastObservationDate: string | null;
  topBird: { name: string; count: number } | null;
  seenCount: number;
  heardCount: number;
  photographedCount: number;
}

export interface LocationObservation {
  id: string;
  birdId: number;
  birdName: string;
  observedAt: string;
  seen: boolean;
  heard: boolean;
  photographed: boolean;
  notes: string | null;
  photoUrl: string | null;
}

export async function getLocationDetailStats(
  userId: string,
  locationName: string,
): Promise<LocationDetailStats> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('observations')
    .select('bird_id, observed_at, seen, heard, photographed')
    .eq('user_id', userId)
    .eq('location_name', locationName)
    .order('observed_at', { ascending: false });

  const rows = data ?? [];
  if (rows.length === 0) {
    return {
      observationCount: 0,
      speciesCount: 0,
      lastObservationDate: null,
      topBird: null,
      seenCount: 0,
      heardCount: 0,
      photographedCount: 0,
    };
  }

  const birdCounts: Record<number, number> = {};
  let seenCount = 0;
  let heardCount = 0;
  let photographedCount = 0;

  for (const row of rows) {
    const bid = row.bird_id as number;
    birdCounts[bid] = (birdCounts[bid] ?? 0) + 1;
    if (row.seen) seenCount++;
    if (row.heard) heardCount++;
    if (row.photographed) photographedCount++;
  }

  const topBirdId = Object.entries(birdCounts).sort((a, b) => b[1] - a[1])[0];

  let topBirdName: string | null = null;
  if (topBirdId) {
    const { data: birdData } = await supabase
      .from('birds')
      .select('name_eng')
      .eq('id', Number(topBirdId[0]))
      .single();
    topBirdName = (birdData?.name_eng as string) ?? null;
  }

  return {
    observationCount: rows.length,
    speciesCount: Object.keys(birdCounts).length,
    lastObservationDate: rows[0].observed_at as string,
    topBird: topBirdId && topBirdName
      ? { name: topBirdName, count: topBirdId[1] }
      : null,
    seenCount,
    heardCount,
    photographedCount,
  };
}

export async function getLocationObservations(
  userId: string,
  locationName: string,
  limit = 10,
): Promise<LocationObservation[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('observations')
    .select('id, bird_id, observed_at, seen, heard, photographed, notes, photo_url')
    .eq('user_id', userId)
    .eq('location_name', locationName)
    .order('observed_at', { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const birdIds = [...new Set(rows.map((r) => r.bird_id as number))];
  const { data: birdsData } = await supabase
    .from('birds')
    .select('id, name_eng')
    .in('id', birdIds);

  const birdNameById: Record<number, string> = {};
  for (const b of birdsData ?? []) {
    birdNameById[b.id as number] = b.name_eng as string;
  }

  return rows.map((row) => ({
    id: row.id as string,
    birdId: row.bird_id as number,
    birdName: birdNameById[row.bird_id as number] ?? 'Unknown',
    observedAt: row.observed_at as string,
    seen: row.seen as boolean,
    heard: row.heard as boolean,
    photographed: row.photographed as boolean,
    notes: (row.notes as string) ?? null,
    photoUrl: (row.photo_url as string) ?? null,
  }));
}
