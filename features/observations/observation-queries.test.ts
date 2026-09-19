import { describe, expect, it, vi, beforeEach } from 'vitest';

const { requireAuth } = vi.hoisted(() => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));
vi.mock('@/features/auth/auth-helpers', () => ({ requireAuth }));

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/shared/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({ from }),
}));

import {
  addObservation,
  getObservationShareSlug,
  setObservationShareSlug,
  type ObservationData,
} from './observation-queries';

const BASE_DATA: ObservationData = {
  birdId: 5,
  observedAt: new Date('2026-01-01'),
  lat: null,
  lng: null,
  locationName: null,
  seen: true,
  heard: false,
  photographed: false,
  quality: null,
  notes: null,
  photoUrl: null,
  photoPublicId: null,
  photoResourceType: null,
};

/**
 * Wires the shared `from` mock to route `observations` inserts and
 * `collected_birds` reads/upserts to independent, inspectable mocks.
 */
function mockTables({
  insertedId = 'new-obs-id',
  existingCollectedRow = null,
}: {
  insertedId?: string;
  existingCollectedRow?: { bird_id: number } | null;
}) {
  const observationsInsert = vi.fn().mockReturnValue({
    select: () => ({
      single: () => Promise.resolve({ data: { id: insertedId }, error: null }),
    }),
  });
  const collectedBirdsSelect = vi.fn().mockReturnValue({
    eq: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: existingCollectedRow, error: null }),
      }),
    }),
  });
  const collectedBirdsUpsert = vi.fn().mockResolvedValue({ error: null });

  from.mockImplementation((table: string) => {
    if (table === 'observations') return { insert: observationsInsert };
    if (table === 'collected_birds') return { select: collectedBirdsSelect, upsert: collectedBirdsUpsert };
    throw new Error(`unexpected table: ${table}`);
  });

  return { observationsInsert, collectedBirdsSelect, collectedBirdsUpsert };
}

describe('addObservation — first-observation tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets first_observation_id when the species has never been collected before', async () => {
    const { collectedBirdsUpsert } = mockTables({ insertedId: 'obs-1', existingCollectedRow: null });

    await addObservation(BASE_DATA);

    expect(collectedBirdsUpsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      bird_id: 5,
      first_observation_id: 'obs-1',
    });
  });

  it('does not touch first_observation_id when the species is already collected (e.g. backdating an older sighting)', async () => {
    const { collectedBirdsUpsert } = mockTables({
      insertedId: 'obs-2-backdated',
      existingCollectedRow: { bird_id: 5 },
    });

    await addObservation(BASE_DATA);

    expect(collectedBirdsUpsert).not.toHaveBeenCalled();
  });
});

describe('getObservationShareSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the share slug for an observation owned by the current user', async () => {
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'obs-1', share_slug: 'abc-123' }, error: null }),
          }),
        }),
      }),
    });

    const result = await getObservationShareSlug('obs-1', 'user-1');

    expect(result).toEqual({ id: 'obs-1', shareSlug: 'abc-123' });
  });

  it('returns null for an observation belonging to another user', async () => {
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'not found' } }),
          }),
        }),
      }),
    });

    const result = await getObservationShareSlug('obs-1', 'user-1');

    expect(result).toBeNull();
  });

  it('returns null shareSlug when the observation has never been shared', async () => {
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { id: 'obs-1', share_slug: null }, error: null }),
          }),
        }),
      }),
    });

    const result = await getObservationShareSlug('obs-1', 'user-1');

    expect(result).toEqual({ id: 'obs-1', shareSlug: null });
  });
});

describe('setObservationShareSlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scopes the update to the given observation and user', async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: null });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const update = vi.fn().mockReturnValue({ eq: eq1 });
    from.mockReturnValue({ update });

    await setObservationShareSlug('obs-1', 'user-1', 'new-slug');

    expect(update).toHaveBeenCalledWith({ share_slug: 'new-slug' });
    expect(eq1).toHaveBeenCalledWith('id', 'obs-1');
    expect(eq2).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('throws when the update fails', async () => {
    from.mockReturnValue({
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: { message: 'db down' } }),
        }),
      }),
    });

    await expect(setObservationShareSlug('obs-1', 'user-1', 'new-slug')).rejects.toThrow('db down');
  });
});
