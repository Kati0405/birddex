import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/features/auth/auth-helpers', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));

const { getObservationShareSlug, setObservationShareSlug } = vi.hoisted(() => ({
  getObservationShareSlug: vi.fn(),
  setObservationShareSlug: vi.fn(),
}));
vi.mock('@/features/observations/observation-queries', () => ({
  getObservationShareSlug,
  setObservationShareSlug,
}));

const { generateShareSlug } = vi.hoisted(() => ({
  generateShareSlug: vi.fn(),
}));
vi.mock('@/shared/lib/slug', () => ({ generateShareSlug }));

import { createObservationShareLinkAction } from './share-mutations';

const OBS_ID = '11111111-1111-4111-8111-111111111111';

describe('createObservationShareLinkAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an invalid observation id before touching the database', async () => {
    const result = await createObservationShareLinkAction({ observationId: 'not-a-uuid' });

    expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }));
    expect(getObservationShareSlug).not.toHaveBeenCalled();
  });

  it('does not create a slug when the observation does not belong to the current user', async () => {
    getObservationShareSlug.mockResolvedValue(null);

    const result = await createObservationShareLinkAction({ observationId: OBS_ID });

    expect(result).toEqual({ error: 'Observation not found' });
    expect(setObservationShareSlug).not.toHaveBeenCalled();
    expect(generateShareSlug).not.toHaveBeenCalled();
  });

  it('creates and persists a new slug when none exists yet', async () => {
    getObservationShareSlug.mockResolvedValue({ id: OBS_ID, shareSlug: null });
    generateShareSlug.mockReturnValue('new-slug-123');
    setObservationShareSlug.mockResolvedValue(undefined);

    const result = await createObservationShareLinkAction({ observationId: OBS_ID });

    expect(result).toEqual({ success: true, shareSlug: 'new-slug-123' });
    expect(setObservationShareSlug).toHaveBeenCalledWith(OBS_ID, 'user-1', 'new-slug-123');
  });

  it('reuses the existing slug and does not create a second one', async () => {
    getObservationShareSlug.mockResolvedValue({ id: OBS_ID, shareSlug: 'existing-slug-456' });

    const result = await createObservationShareLinkAction({ observationId: OBS_ID });

    expect(result).toEqual({ success: true, shareSlug: 'existing-slug-456' });
    expect(generateShareSlug).not.toHaveBeenCalled();
    expect(setObservationShareSlug).not.toHaveBeenCalled();
  });

  it('surfaces an error and does not return a slug when persisting fails', async () => {
    getObservationShareSlug.mockResolvedValue({ id: OBS_ID, shareSlug: null });
    generateShareSlug.mockReturnValue('new-slug-789');
    setObservationShareSlug.mockRejectedValue(new Error('db down'));

    const result = await createObservationShareLinkAction({ observationId: OBS_ID });

    expect(result).toEqual({ error: 'db down' });
  });
});
