import 'server-only';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import type { Rarity, WikimediaImage } from '@/entities/bird-domain';

export interface ObservationShareData {
  shareSlug: string;

  birdName: string;
  scientificName: string;
  rarity: Rarity;

  photo: {
    url: string;
    source: 'observation' | 'bird-default';
    credit: string | null;
    creditUrl: string | null;
  };

  observedAt: string;

  location: {
    displayName: string | null;
  };

  methods: {
    seen: boolean;
    heard: boolean;
    photographed: boolean;
  };

  quality: number | null;

  isFirstObservationOfSpecies: boolean;

  author: {
    displayName: string | null;
  };
}

/**
 * Reverse-geocodes lat/lng into a "City, Region" display string, entirely
 * server-side. Never derived from observations.location_name — that column
 * can hold a private saved-location label verbatim (see docs/specs/
 * observation-sharing.md §10) and must never reach a public surface.
 */
async function resolveShareLocation(lat: number | null, lng: number | null): Promise<string | null> {
  if (lat == null || lng == null) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'birds.in.ua share card' },
        next: { revalidate: 60 * 60 * 24 * 30 },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.suburb ?? '';
    const region = addr.state ?? addr.county ?? addr.region ?? '';
    if (city && region) return `${city}, ${region}`;
    return city || region || null;
  } catch {
    return null;
  }
}

/** HEAD-checks a URL, used to fall through to the bird default photo if the observation's stored photo URL no longer resolves. */
async function urlResolves(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

function birdDefaultPhoto(bird: {
  selected_image: WikimediaImage | null;
  image_url: string | null;
}): { url: string; credit: string | null; creditUrl: string | null } | null {
  if (bird.selected_image) {
    return {
      url: bird.selected_image.imageUrl,
      credit: `${bird.selected_image.author} / Wikimedia Commons`,
      creditUrl: bird.selected_image.sourceUrl,
    };
  }
  if (bird.image_url) {
    return { url: bird.image_url, credit: null, creditUrl: null };
  }
  return null;
}

export async function getPublicObservationShareData(shareSlug: string): Promise<ObservationShareData | null> {
  const { data: observation, error } = await supabaseAdmin
    .from('observations')
    .select('id, user_id, bird_id, observed_at, seen, heard, photographed, quality, lat, lng, photo_url, share_slug')
    .eq('share_slug', shareSlug)
    .maybeSingle();
  if (error || !observation) return null;

  const [{ data: bird }, { data: collectedRow }, { data: profile }] = await Promise.all([
    supabaseAdmin
      .from('birds')
      .select('name_eng, name_latin, rarity, selected_image, image_url')
      .eq('id', observation.bird_id as number)
      .single(),
    supabaseAdmin
      .from('collected_birds')
      .select('first_observation_id')
      .eq('user_id', observation.user_id as string)
      .eq('bird_id', observation.bird_id as number)
      .maybeSingle(),
    supabaseAdmin
      .from('profiles')
      .select('nickname')
      .eq('id', observation.user_id as string)
      .maybeSingle(),
  ]);
  if (!bird) return null;

  const observationPhotoUrl = (observation.photo_url as string) ?? null;
  const [locationDisplayName, observationPhotoOk] = await Promise.all([
    resolveShareLocation((observation.lat as number) ?? null, (observation.lng as number) ?? null),
    observationPhotoUrl ? urlResolves(observationPhotoUrl) : Promise.resolve(false),
  ]);

  let photo: ObservationShareData['photo'];
  if (observationPhotoUrl && observationPhotoOk) {
    photo = {
      url: observationPhotoUrl,
      source: 'observation',
      credit: (profile?.nickname as string | null) ?? null,
      creditUrl: null,
    };
  } else {
    const fallback = birdDefaultPhoto({
      selected_image: (bird.selected_image as WikimediaImage) ?? null,
      image_url: (bird.image_url as string) ?? null,
    });
    photo = fallback
      ? { url: fallback.url, source: 'bird-default', credit: fallback.credit, creditUrl: fallback.creditUrl }
      : { url: '', source: 'bird-default', credit: null, creditUrl: null };
  }

  return {
    shareSlug: observation.share_slug as string,
    birdName: bird.name_eng as string,
    scientificName: bird.name_latin as string,
    rarity: bird.rarity as Rarity,
    photo,
    observedAt: observation.observed_at as string,
    location: { displayName: locationDisplayName },
    methods: {
      seen: observation.seen as boolean,
      heard: observation.heard as boolean,
      photographed: observation.photographed as boolean,
    },
    quality: (observation.quality as number | null) ?? null,
    isFirstObservationOfSpecies: (collectedRow?.first_observation_id as string | null) === (observation.id as string),
    author: { displayName: (profile?.nickname as string | null) ?? null },
  };
}
