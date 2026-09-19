import { describe, expect, it, vi, beforeEach } from 'vitest';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/shared/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({ from }),
}));

import { getFirstObservationIds } from './collection-queries';

describe('getFirstObservationIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockRows(rows: { first_observation_id: string | null }[]) {
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          not: () => Promise.resolve({ data: rows, error: null }),
        }),
      }),
    });
  }

  it('returns the set of first_observation_id values for the user', async () => {
    mockRows([{ first_observation_id: 'obs-1' }, { first_observation_id: 'obs-2' }]);

    const ids = await getFirstObservationIds('user-1');

    expect(ids).toEqual(new Set(['obs-1', 'obs-2']));
  });

  it('returns an empty set when the user has no tracked first observations', async () => {
    mockRows([]);

    const ids = await getFirstObservationIds('user-1');

    expect(ids.size).toBe(0);
  });
});
