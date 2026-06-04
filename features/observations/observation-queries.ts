import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import { requireAuth } from '@/features/auth/auth-helpers';

export type ObservationQuality = 'bad' | 'good' | 'excellent' | null;

export interface ObservationData {
  birdId: number;
  observedAt: Date;
  lat: number | null;
  lng: number | null;
  locationName: string | null;
  seen: boolean;
  heard: boolean;
  photographed: boolean;
  quality: ObservationQuality;
  notes: string | null;
  photoUrl: string | null;
}

export async function addObservation(data: ObservationData): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  await supabase.from('observations').insert({
    user_id: user.id,
    bird_id: data.birdId,
    observed_at: data.observedAt.toISOString(),
    lat: data.lat,
    lng: data.lng,
    location_name: data.locationName,
    seen: data.seen,
    heard: data.heard,
    photographed: data.photographed,
    quality: data.quality,
    notes: data.notes,
    photo_url: data.photoUrl,
  });
}

export interface ObservationEntry {
  id: string;
  observedAt: string;
  seen: boolean;
  heard: boolean;
  photographed: boolean;
  quality: ObservationQuality;
  notes: string | null;
  photoUrl: string | null;
  lat: number | null;
  lng: number | null;
  locationName: string | null;
}

export interface CollectionCardData {
  birdId: number;
  totalCount: number;
  seenCount: number;
  heardCount: number;
  photographedCount: number;
  observations: ObservationEntry[]; // newest first
}

export async function getCollectionCardDataByBirdIds(
  userId: string,
  birdIds: number[],
): Promise<Record<number, CollectionCardData>> {
  if (birdIds.length === 0) return {};
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('observations')
    .select('id, bird_id, observed_at, seen, heard, photographed, quality, notes, photo_url, lat, lng, location_name')
    .eq('user_id', userId)
    .in('bird_id', birdIds)
    .order('observed_at', { ascending: false });

  const rows = data ?? [];
  const byBird: Record<number, typeof rows> = {};
  for (const row of rows) {
    const id = row.bird_id as number;
    (byBird[id] ??= []).push(row);
  }

  const result: Record<number, CollectionCardData> = {};
  for (const [idStr, birdRows] of Object.entries(byBird)) {
    const id = Number(idStr);
    let seenCount = 0, heardCount = 0, photographedCount = 0;

    const observations: ObservationEntry[] = birdRows.map((row) => {
      if (row.seen) seenCount++;
      if (row.heard) heardCount++;
      if (row.photographed) photographedCount++;
      return {
        id: row.id as string,
        observedAt: row.observed_at as string,
        seen: row.seen as boolean,
        heard: row.heard as boolean,
        photographed: row.photographed as boolean,
        quality: (row.quality as ObservationQuality) ?? null,
        notes: (row.notes as string) ?? null,
        photoUrl: (row.photo_url as string) ?? null,
        lat: (row.lat as number) ?? null,
        lng: (row.lng as number) ?? null,
        locationName: (row.location_name as string) ?? null,
      };
    });

    result[id] = {
      birdId: id,
      totalCount: birdRows.length,
      seenCount,
      heardCount,
      photographedCount,
      observations,
    };
  }
  return result;
}

export interface ObservationUpdate {
  observedAt: Date;
  lat: number | null;
  lng: number | null;
  locationName: string | null;
  seen: boolean;
  heard: boolean;
  photographed: boolean;
  quality: ObservationQuality;
  notes: string | null;
  photoUrl: string | null;
}

export async function updateObservation(id: string, data: ObservationUpdate): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from('observations')
    .update({
      observed_at: data.observedAt.toISOString(),
      lat: data.lat,
      lng: data.lng,
      location_name: data.locationName,
      seen: data.seen,
      heard: data.heard,
      photographed: data.photographed,
      quality: data.quality,
      notes: data.notes,
      photo_url: data.photoUrl,
    })
    .eq('id', id)
    .eq('user_id', user.id);
}

export async function getObservedBirdIds(userId: string): Promise<number[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('observations')
    .select('bird_id')
    .eq('user_id', userId);
  const ids = (data ?? []).map((r) => r.bird_id as number);
  return [...new Set(ids)];
}

export async function getObservationCount(userId: string): Promise<number> {
  const ids = await getObservedBirdIds(userId);
  return ids.length;
}
