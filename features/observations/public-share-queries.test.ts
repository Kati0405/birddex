import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/shared/lib/supabase-admin', () => ({
  supabaseAdmin: { from },
}));

const originalFetch = global.fetch;

import { getPublicObservationShareData } from './public-share-queries';

const SHARE_SLUG = 'share-slug-abc';
const OBS_ID = 'obs-1';
const USER_ID = 'user-1';
const BIRD_ID = 5;

interface MockOptions {
  observation?: Record<string, unknown> | null;
  bird?: Record<string, unknown> | null;
  collectedRow?: { first_observation_id: string | null } | null;
  profile?: { nickname: string | null } | null;
}

function baseObservation(overrides: Record<string, unknown> = {}) {
  return {
    id: OBS_ID,
    user_id: USER_ID,
    bird_id: BIRD_ID,
    observed_at: '2026-05-01T10:00:00Z',
    seen: true,
    heard: false,
    photographed: true,
    quality: 4,
    lat: 49.8397,
    lng: 24.0297,
    photo_url: 'https://res.cloudinary.com/demo/image/upload/v1/birddex/observations/photo.jpg',
    share_slug: SHARE_SLUG,
    ...overrides,
  };
}

function baseBird(overrides: Record<string, unknown> = {}) {
  return {
    name_eng: 'European Robin',
    name_latin: 'Erithacus rubecula',
    rarity: 'Common',
    selected_image: null,
    image_url: null,
    ...overrides,
  };
}

function mockTables({
  observation = baseObservation(),
  bird = baseBird(),
  collectedRow = { first_observation_id: OBS_ID },
  profile = { nickname: 'birdwatcher42' },
}: MockOptions) {
  from.mockImplementation((table: string) => {
    if (table === 'observations') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: observation, error: observation ? null : { message: 'not found' } }),
          }),
        }),
      };
    }
    if (table === 'birds') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: bird, error: bird ? null : { message: 'not found' } }),
          }),
        }),
      };
    }
    if (table === 'collected_birds') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: collectedRow, error: null }),
            }),
          }),
        }),
      };
    }
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: profile, error: null }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });
}

function mockFetch({ geocodeOk = true, photoResolves = true }: { geocodeOk?: boolean; photoResolves?: boolean } = {}) {
  global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (init?.method === 'HEAD') {
      return Promise.resolve({ ok: photoResolves } as Response);
    }
    if (String(url).includes('nominatim')) {
      if (!geocodeOk) return Promise.resolve({ ok: false } as Response);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ address: { city: 'Lviv', state: 'Lviv Oblast' } }),
      } as Response);
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  }) as unknown as typeof fetch;
}

describe('getPublicObservationShareData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns null for an unknown or invalid share slug', async () => {
    mockTables({ observation: null });
    mockFetch();

    const result = await getPublicObservationShareData('nonexistent-slug');

    expect(result).toBeNull();
  });

  it('returns a full DTO with no notes, coordinates, or raw user/observation ids', async () => {
    mockTables({});
    mockFetch();

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result).not.toBeNull();
    expect(result).toEqual({
      shareSlug: SHARE_SLUG,
      birdName: 'European Robin',
      scientificName: 'Erithacus rubecula',
      rarity: 'Common',
      photo: {
        url: 'https://res.cloudinary.com/demo/image/upload/v1/birddex/observations/photo.jpg',
        source: 'observation',
        credit: 'birdwatcher42',
        creditUrl: null,
      },
      observedAt: '2026-05-01T10:00:00Z',
      location: { displayName: 'Lviv, Lviv Oblast' },
      methods: { seen: true, heard: false, photographed: true },
      quality: 4,
      isFirstObservationOfSpecies: true,
      author: { displayName: 'birdwatcher42' },
    });
    expect(result).not.toHaveProperty('notes');
    expect(result).not.toHaveProperty('lat');
    expect(result).not.toHaveProperty('lng');
    expect(result).not.toHaveProperty('userId');
    expect(JSON.stringify(result)).not.toContain(USER_ID);
  });

  it('never reads location_name — location comes only from the geocode result', async () => {
    mockTables({
      observation: baseObservation({ location_name: 'My secret owl spot' }),
    });
    mockFetch();

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result?.location.displayName).toBe('Lviv, Lviv Oblast');
    expect(JSON.stringify(result)).not.toContain('secret owl spot');
  });

  it('falls back to bird default photo with Wikimedia credit when there is no observation photo', async () => {
    mockTables({
      observation: baseObservation({ photo_url: null }),
      bird: baseBird({
        selected_image: {
          imageUrl: 'https://upload.wikimedia.org/robin.jpg',
          thumbnailUrl: 'https://upload.wikimedia.org/robin-thumb.jpg',
          author: 'Jane Doe',
          license: 'CC BY-SA',
          sourceUrl: 'https://commons.wikimedia.org/robin',
        },
      }),
    });
    mockFetch();

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result?.photo).toEqual({
      url: 'https://upload.wikimedia.org/robin.jpg',
      source: 'bird-default',
      credit: 'Jane Doe / Wikimedia Commons',
      creditUrl: 'https://commons.wikimedia.org/robin',
    });
  });

  it('falls back to bird image_url with null credit when there is no selected_image either', async () => {
    mockTables({
      observation: baseObservation({ photo_url: null }),
      bird: baseBird({ selected_image: null, image_url: 'https://res.cloudinary.com/demo/image/upload/v1/birds/robin.jpg' }),
    });
    mockFetch();

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result?.photo).toEqual({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/birds/robin.jpg',
      source: 'bird-default',
      credit: null,
      creditUrl: null,
    });
  });

  it('falls through to the bird default when the observation photo URL no longer resolves', async () => {
    mockTables({
      observation: baseObservation(),
      bird: baseBird({ image_url: 'https://res.cloudinary.com/demo/image/upload/v1/birds/robin.jpg' }),
    });
    mockFetch({ photoResolves: false });

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result?.photo.source).toBe('bird-default');
  });

  it('returns a placeholder (empty url) when neither an observation photo nor any bird default exists', async () => {
    mockTables({
      observation: baseObservation({ photo_url: null }),
      bird: baseBird({ selected_image: null, image_url: null }),
    });
    mockFetch();

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result?.photo).toEqual({ url: '', source: 'bird-default', credit: null, creditUrl: null });
  });

  it('does not expose the Google account name/email as photo credit when the observer has no nickname set', async () => {
    mockTables({ profile: { nickname: null } });
    mockFetch();

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result?.photo.credit).toBeNull();
    expect(result?.author.displayName).toBeNull();
  });

  it('sets isFirstObservationOfSpecies to false when this is not the tracked first observation', async () => {
    mockTables({ collectedRow: { first_observation_id: 'some-other-obs' } });
    mockFetch();

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result?.isFirstObservationOfSpecies).toBe(false);
  });

  it('sets isFirstObservationOfSpecies to false when the species has no tracked first observation at all', async () => {
    mockTables({ collectedRow: null });
    mockFetch();

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result?.isFirstObservationOfSpecies).toBe(false);
  });

  it('omits location when lat/lng are both null, without calling the geocoder', async () => {
    mockTables({ observation: baseObservation({ lat: null, lng: null }) });
    mockFetch();

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result?.location.displayName).toBeNull();
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('nominatim'), expect.anything());
  });

  it('returns null location when the geocode request fails, without throwing', async () => {
    mockTables({});
    mockFetch({ geocodeOk: false });

    const result = await getPublicObservationShareData(SHARE_SLUG);

    expect(result?.location.displayName).toBeNull();
  });
});
