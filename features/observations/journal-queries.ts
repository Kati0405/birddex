import { format } from 'date-fns';
import { createSupabaseServerClient } from '@/shared/lib/supabase-server';
import { requireAuth } from '@/features/auth/auth-helpers';
import { isCloudinaryUrl, cloudinaryThumbnail } from '@/shared/lib/cloudinary-utils';
import type { ObservationQuality } from '@/features/observations/observation-queries';
import { monthKeyToString, type MonthKey } from '@/features/observations/journal-month';
import type { Bird, Biome, Food } from '@/entities/bird-domain';

export type { MonthKey } from '@/features/observations/journal-month';
export { monthKeyToString, parseMonthKey, currentMonthKey, clampToCurrentMonth } from '@/features/observations/journal-month';

function monthRange({ year, month }: MonthKey): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

export interface JournalObservation {
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
  isFirstEncounter: boolean;
}

export interface JournalMonthStats {
  speciesCount: number;
  observationCount: number;
  daysWithSightings: number;
  photosAddedCount: number;
}

interface BirdInfo {
  name: string;
  nameLatin: string;
  imageUrl: string | null;
  thumbUrl: string | null;
  selectedImage: Bird['selected_image'];
  rarity: string;
  biomes: Biome[];
  food: Food[];
}

async function birdInfoByIds(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  birdIds: number[],
): Promise<Record<number, BirdInfo>> {
  if (birdIds.length === 0) return {};
  const { data } = await supabase
    .from('birds')
    .select('id, name_eng, name_latin, image_url, selected_image, rarity, biomes, food')
    .in('id', birdIds);

  const byId: Record<number, BirdInfo> = {};
  for (const b of data ?? []) {
    const selectedImage = b.selected_image as { imageUrl?: string; thumbnailUrl?: string } | null;
    const fullImageUrl = selectedImage?.imageUrl ?? (b.image_url as string) ?? null;
    const thumbUrl = selectedImage?.thumbnailUrl
      ?? (fullImageUrl && isCloudinaryUrl(fullImageUrl) ? cloudinaryThumbnail(fullImageUrl, 64) : fullImageUrl);
    byId[b.id as number] = {
      name: b.name_eng as string,
      nameLatin: (b.name_latin as string) ?? '',
      imageUrl: fullImageUrl,
      thumbUrl,
      selectedImage: (b.selected_image as Bird['selected_image']) ?? undefined,
      rarity: b.rarity as string,
      biomes: (b.biomes as Biome[]) ?? [],
      food: (b.food as Food[]) ?? [],
    };
  }
  return byId;
}

/**
 * The earliest-dated observation id per species across the user's full history.
 * Ties on the same observed_at date are broken by lowest observation id, so the
 * result is deterministic regardless of query order.
 */
export async function getFirstEncounterObservationIds(userId: string): Promise<Set<string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('observations')
    .select('id, bird_id, observed_at')
    .eq('user_id', userId)
    .order('bird_id', { ascending: true })
    .order('observed_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error(`getFirstEncounterObservationIds: ${error.message}`);

  const firstByBird = new Map<number, { id: string; observedAt: string }>();
  for (const row of data ?? []) {
    const birdId = row.bird_id as number;
    const existing = firstByBird.get(birdId);
    const observedAt = row.observed_at as string;
    const id = row.id as string;
    if (!existing) {
      firstByBird.set(birdId, { id, observedAt });
      continue;
    }
    if (
      observedAt < existing.observedAt ||
      (observedAt === existing.observedAt && id < existing.id)
    ) {
      firstByBird.set(birdId, { id, observedAt });
    }
  }
  return new Set([...firstByBird.values()].map((v) => v.id));
}

export interface JournalNewSpecies {
  birdId: number;
  birdName: string;
  birdNameLatin: string;
  birdImageUrl: string | null;
  birdSelectedImage: Bird['selected_image'];
  birdRarity: string;
  birdBiomes: Biome[];
  birdFood: Food[];
  firstEncounterAt: string;
}

export interface JournalMonthData {
  stats: JournalMonthStats;
  observations: JournalObservation[];
  newSpecies: JournalNewSpecies[];
}

export async function getJournalMonthData(monthKey: MonthKey): Promise<JournalMonthData> {
  const user = await requireAuth();
  const supabase = await createSupabaseServerClient();
  const { start, end } = monthRange(monthKey);

  const [{ data: monthRows, error: monthError }, firstEncounterIds] = await Promise.all([
    supabase
      .from('observations')
      .select('id, bird_id, observed_at, seen, heard, photographed, quality, notes, photo_url, lat, lng, location_name')
      .eq('user_id', user.id)
      .gte('observed_at', start.toISOString())
      .lt('observed_at', end.toISOString())
      .order('observed_at', { ascending: false }),
    getFirstEncounterObservationIds(user.id),
  ]);
  if (monthError) throw new Error(`getJournalMonthData: ${monthError.message}`);

  const rows = monthRows ?? [];
  const birdIds = [...new Set(rows.map((r) => r.bird_id as number))];
  const birdById = await birdInfoByIds(supabase, birdIds);

  const speciesSet = new Set<number>();
  const daySet = new Set<string>();
  let photosAddedCount = 0;
  const observations: JournalObservation[] = rows.map((row) => {
    const birdId = row.bird_id as number;
    speciesSet.add(birdId);
    // Matches the client's local-calendar-date grouping (see JournalTimeline's
    // groupByDate) rather than slicing the raw UTC observed_at string.
    daySet.add(format(new Date(row.observed_at as string), 'yyyy-MM-dd'));
    const bird = birdById[birdId];
    const rawPhotoUrl = (row.photo_url as string) ?? null;
    if (rawPhotoUrl) photosAddedCount++;
    return {
      id: row.id as string,
      birdId,
      birdName: bird?.name ?? 'Unknown',
      birdImageUrl: bird?.thumbUrl ?? null,
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
      isFirstEncounter: firstEncounterIds.has(row.id as string),
    };
  });

  const newSpecies: JournalNewSpecies[] = observations
    .filter((o) => o.isFirstEncounter)
    .map((o) => {
      const bird = birdById[o.birdId];
      return {
        birdId: o.birdId,
        birdName: o.birdName,
        birdNameLatin: bird?.nameLatin ?? '',
        birdImageUrl: bird?.imageUrl ?? null,
        birdSelectedImage: bird?.selectedImage,
        birdRarity: o.birdRarity,
        birdBiomes: bird?.biomes ?? [],
        birdFood: bird?.food ?? [],
        firstEncounterAt: o.observedAt,
      };
    })
    .sort((a, b) => (a.firstEncounterAt < b.firstEncounterAt ? 1 : -1));

  return {
    stats: {
      speciesCount: speciesSet.size,
      observationCount: rows.length,
      daysWithSightings: daySet.size,
      photosAddedCount,
    },
    observations,
    newSpecies,
  };
}

export interface JournalPhotoOption {
  observationId: string;
  photoUrl: string;
  birdName: string;
}

export interface JournalPhotoOfMonth {
  observationId: string;
  photoUrl: string;
}

export async function getJournalPhotoOfMonth(userId: string, monthKey: MonthKey): Promise<JournalPhotoOfMonth | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('journal_photo_of_month')
    .select('observation_id, observations(photo_url)')
    .eq('user_id', userId)
    .eq('month_key', monthKeyToString(monthKey))
    .maybeSingle();

  if (!data) return null;
  const observation = data.observations as unknown as { photo_url: string | null } | null;
  if (!observation?.photo_url) return null;
  return { observationId: data.observation_id as string, photoUrl: observation.photo_url };
}

export function getJournalPhotoOptions(monthData: JournalMonthData): JournalPhotoOption[] {
  return monthData.observations
    .filter((o): o is JournalObservation & { photoUrl: string } => o.photoUrl != null)
    .map((o) => ({ observationId: o.id, photoUrl: o.photoUrl, birdName: o.birdName }));
}

export async function setJournalPhotoOfMonth(
  userId: string,
  monthKey: MonthKey,
  observationId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data: observation, error: fetchError } = await supabase
    .from('observations')
    .select('id, photo_url')
    .eq('id', observationId)
    .eq('user_id', userId)
    .single();
  if (fetchError || !observation) throw new Error('setJournalPhotoOfMonth: observation not found');
  if (!observation.photo_url) throw new Error('setJournalPhotoOfMonth: observation has no photo');

  const { error } = await supabase
    .from('journal_photo_of_month')
    .upsert(
      { user_id: userId, month_key: monthKeyToString(monthKey), observation_id: observationId },
      { onConflict: 'user_id,month_key' },
    );
  if (error) throw new Error(`setJournalPhotoOfMonth: ${error.message}`);
}
