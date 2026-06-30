import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import { requireAuth } from '@/features/auth/auth-helpers';
import { isCloudinaryUrl, cloudinaryThumbnail } from '@/shared/lib/cloudinary-utils';

export type ObservationQuality = 1 | 2 | 3 | 4 | 5 | null;

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
  const { error } = await supabase.from('observations').insert({
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
  if (error) throw new Error(`addObservation: ${error.message}`);
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
  const { error } = await supabase
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
  if (error) throw new Error(`updateObservation(${id}): ${error.message}`);
}

export async function deleteObservation(id: string): Promise<void> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('observations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw new Error(`deleteObservation(${id}): ${error.message}`);
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
  const supabase = await createSupabaseServerClient();
  // Supabase's query builder doesn't support COUNT(DISTINCT) directly.
  // Selecting only bird_id (one int column, no row body) is cheap and lets us
  // deduplicate in JS to get the unique-species count the header badge shows.
  const { data, error } = await supabase
    .from('observations')
    .select('bird_id')
    .eq('user_id', userId);
  if (error) throw new Error(`getObservationCount: ${error.message}`);
  return new Set((data ?? []).map((r) => r.bird_id as number)).size;
}

export interface ObservationPhoto {
  observationId: string;
  photoUrl: string;
  observedAt: string;
  birdId: number;
  birdNameEng: string;
}

export interface UserObservation {
  id: string;
  birdId: number;
  birdName: string;
  birdImageUrl: string | null;
  birdRarity: string;
  observedAt: string;
  seen: boolean;
  heard: boolean;
  photographed: boolean;
  quality: ObservationQuality;
  notes: string | null;
  photoUrl: string | null;
  photoThumbUrl: string | null;
  lat: number | null;
  lng: number | null;
  locationName: string | null;
}

export async function getAllUserObservations(): Promise<UserObservation[]> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('observations')
    .select('id, bird_id, observed_at, seen, heard, photographed, quality, notes, photo_url, lat, lng, location_name')
    .eq('user_id', user.id)
    .order('observed_at', { ascending: false });

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const birdIds = [...new Set(rows.map((r) => r.bird_id as number))];
  const { data: birdsData } = await supabase
    .from('birds')
    .select('id, name_eng, image_url, selected_image, rarity')
    .in('id', birdIds);

  const birdById: Record<number, { name: string; imageUrl: string | null; rarity: string }> = {};
  for (const b of birdsData ?? []) {
    const selectedImage = b.selected_image as { imageUrl?: string; thumbnailUrl?: string } | null;
    const fullImageUrl = selectedImage?.imageUrl ?? (b.image_url as string) ?? null;
    const thumbUrl = selectedImage?.thumbnailUrl
      ?? (fullImageUrl && isCloudinaryUrl(fullImageUrl) ? cloudinaryThumbnail(fullImageUrl, 64) : fullImageUrl);
    birdById[b.id as number] = {
      name: b.name_eng as string,
      imageUrl: thumbUrl,
      rarity: b.rarity as string,
    };
  }

  return rows.map((row) => {
    const bird = birdById[row.bird_id as number];
    const rawPhotoUrl = (row.photo_url as string) ?? null;
    return {
      id: row.id as string,
      birdId: row.bird_id as number,
      birdName: bird?.name ?? 'Unknown',
      birdImageUrl: bird?.imageUrl ?? null,
      birdRarity: bird?.rarity ?? 'Common',
      observedAt: row.observed_at as string,
      seen: row.seen as boolean,
      heard: row.heard as boolean,
      photographed: row.photographed as boolean,
      quality: (row.quality as ObservationQuality) ?? null,
      notes: (row.notes as string) ?? null,
      photoUrl: rawPhotoUrl,
      photoThumbUrl: rawPhotoUrl && isCloudinaryUrl(rawPhotoUrl) ? cloudinaryThumbnail(rawPhotoUrl, 64) : rawPhotoUrl,
      lat: (row.lat as number) ?? null,
      lng: (row.lng as number) ?? null,
      locationName: (row.location_name as string) ?? null,
    };
  });
}

export async function getUserObservationPhotos(): Promise<ObservationPhoto[]> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('observations')
    .select('id, photo_url, observed_at, bird_id')
    .eq('user_id', user.id)
    .not('photo_url', 'is', null)
    .order('observed_at', { ascending: false });

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
    observationId: row.id as string,
    photoUrl: row.photo_url as string,
    observedAt: row.observed_at as string,
    birdId: row.bird_id as number,
    birdNameEng: birdNameById[row.bird_id as number] ?? 'Unknown',
  }));
}
