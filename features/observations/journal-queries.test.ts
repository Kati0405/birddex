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
  monthKeyToString,
  parseMonthKey,
  currentMonthKey,
  clampToCurrentMonth,
  getFirstEncounterObservationIds,
  getJournalPhotoOptions,
  type JournalMonthData,
  type JournalObservation,
} from './journal-queries';

describe('monthKeyToString', () => {
  it('pads single-digit months', () => {
    expect(monthKeyToString({ year: 2026, month: 9 })).toBe('2026-09');
  });

  it('does not pad two-digit months', () => {
    expect(monthKeyToString({ year: 2026, month: 12 })).toBe('2026-12');
  });
});

describe('parseMonthKey', () => {
  it('parses a valid YYYY-MM string', () => {
    expect(parseMonthKey('2026-09')).toEqual({ year: 2026, month: 9 });
  });

  it('returns null for missing input', () => {
    expect(parseMonthKey(undefined)).toBeNull();
    expect(parseMonthKey(null)).toBeNull();
    expect(parseMonthKey('')).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(parseMonthKey('not-a-month')).toBeNull();
    expect(parseMonthKey('2026-9')).toBeNull();
    expect(parseMonthKey('2026/09')).toBeNull();
  });

  it('returns null for an out-of-range month', () => {
    expect(parseMonthKey('2026-00')).toBeNull();
    expect(parseMonthKey('2026-13')).toBeNull();
  });
});

describe('clampToCurrentMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 10)); // September 2026 (0-indexed month)
  });

  it('returns the same month when not in the future', () => {
    expect(clampToCurrentMonth({ year: 2026, month: 9 })).toEqual({ year: 2026, month: 9 });
    expect(clampToCurrentMonth({ year: 2025, month: 12 })).toEqual({ year: 2025, month: 12 });
  });

  it('clamps a future month within the same year to the current month', () => {
    expect(clampToCurrentMonth({ year: 2026, month: 10 })).toEqual(currentMonthKey());
  });

  it('clamps a future year to the current month', () => {
    expect(clampToCurrentMonth({ year: 2027, month: 1 })).toEqual(currentMonthKey());
  });
});

describe('getFirstEncounterObservationIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockObservationRows(rows: { id: string; bird_id: number; observed_at: string }[]) {
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => ({
              order: () => Promise.resolve({ data: rows, error: null }),
            }),
          }),
        }),
      }),
    });
  }

  it('picks the earliest observed_at per species', async () => {
    mockObservationRows([
      { id: 'a', bird_id: 1, observed_at: '2026-01-05T00:00:00Z' },
      { id: 'b', bird_id: 1, observed_at: '2026-01-01T00:00:00Z' },
      { id: 'c', bird_id: 2, observed_at: '2026-02-01T00:00:00Z' },
    ]);

    const ids = await getFirstEncounterObservationIds('user-1');

    expect(ids).toEqual(new Set(['b', 'c']));
  });

  it('breaks ties on the same date by the lowest observation id, deterministically', async () => {
    mockObservationRows([
      { id: 'zzzz', bird_id: 1, observed_at: '2026-01-01T00:00:00Z' },
      { id: 'aaaa', bird_id: 1, observed_at: '2026-01-01T00:00:00Z' },
      { id: 'mmmm', bird_id: 1, observed_at: '2026-01-01T00:00:00Z' },
    ]);

    const ids = await getFirstEncounterObservationIds('user-1');

    expect(ids).toEqual(new Set(['aaaa']));
  });

  it('returns an empty set when there are no observations', async () => {
    mockObservationRows([]);

    const ids = await getFirstEncounterObservationIds('user-1');

    expect(ids.size).toBe(0);
  });
});

describe('getJournalPhotoOptions', () => {
  function makeObservation(overrides: Partial<JournalObservation>): JournalObservation {
    return {
      id: 'obs-1',
      birdId: 1,
      birdName: 'European Robin',
      birdImageUrl: null,
      birdRarity: 'Common',
      observedAt: '2026-09-01T00:00:00Z',
      seen: true,
      heard: false,
      photographed: false,
      quality: null,
      notes: null,
      photoUrl: null,
      photoThumbUrl: null,
      lat: null,
      lng: null,
      locationName: null,
      isFirstEncounter: false,
      ...overrides,
    };
  }

  it('only includes observations that have a photo', () => {
    const data: JournalMonthData = {
      stats: { speciesCount: 2, observationCount: 2, daysWithSightings: 2, photosAddedCount: 1 },
      newSpecies: [],
      observations: [
        makeObservation({ id: 'no-photo', photoUrl: null }),
        makeObservation({ id: 'has-photo', photoUrl: 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg' }),
      ],
    };

    const options = getJournalPhotoOptions(data);

    expect(options).toEqual([
      { observationId: 'has-photo', photoUrl: 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg', birdName: 'European Robin' },
    ]);
  });
});
