import { describe, expect, it, vi, beforeEach } from 'vitest';

const { setJournalPhotoOfMonth } = vi.hoisted(() => ({
  setJournalPhotoOfMonth: vi.fn(),
}));
vi.mock('@/features/observations/journal-queries', async () => {
  const actual = await vi.importActual<typeof import('@/features/observations/journal-queries')>(
    '@/features/observations/journal-queries',
  );
  return { ...actual, setJournalPhotoOfMonth };
});

vi.mock('@/features/auth/auth-helpers', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { setJournalPhotoOfMonthAction } from './journal-mutations';

const OBS_ID = '11111111-1111-4111-8111-111111111111';

describe('setJournalPhotoOfMonthAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an invalid month key without calling the query helper', async () => {
    const result = await setJournalPhotoOfMonthAction({ monthKey: 'not-a-month', observationId: OBS_ID });

    expect(result).toEqual({ error: expect.any(String) });
    expect(setJournalPhotoOfMonth).not.toHaveBeenCalled();
  });

  it('rejects a non-uuid observation id without calling the query helper', async () => {
    const result = await setJournalPhotoOfMonthAction({ monthKey: '2026-09', observationId: 'not-a-uuid' });

    expect(result).toEqual({ error: expect.any(String) });
    expect(setJournalPhotoOfMonth).not.toHaveBeenCalled();
  });

  it('scopes the mutation to the authenticated user, not client input', async () => {
    setJournalPhotoOfMonth.mockResolvedValue(undefined);

    const result = await setJournalPhotoOfMonthAction({ monthKey: '2026-09', observationId: OBS_ID });

    expect(result).toEqual({ success: true });
    expect(setJournalPhotoOfMonth).toHaveBeenCalledWith('user-1', { year: 2026, month: 9 }, OBS_ID);
  });

  it('surfaces an error when the observation does not belong to the user or has no photo', async () => {
    setJournalPhotoOfMonth.mockRejectedValue(new Error('setJournalPhotoOfMonth: observation not found'));

    const result = await setJournalPhotoOfMonthAction({ monthKey: '2026-09', observationId: OBS_ID });

    expect(result).toEqual({ error: 'setJournalPhotoOfMonth: observation not found' });
  });
});
