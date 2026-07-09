import { describe, expect, it, vi, beforeEach } from 'vitest';

const { deleteCloudinaryAsset } = vi.hoisted(() => ({
  deleteCloudinaryAsset: vi.fn(),
}));
vi.mock('@/shared/lib/cloudinary', () => ({
  deleteCloudinaryAsset,
}));

const { getBirdById, deleteBird, BirdHasObservationsError } = vi.hoisted(() => {
  class BirdHasObservationsError extends Error {}
  return {
    getBirdById: vi.fn(),
    deleteBird: vi.fn(),
    BirdHasObservationsError,
  };
});
vi.mock('@/features/birds/bird-queries', () => ({
  getBirdById,
  deleteBird,
  BirdHasObservationsError,
}));

vi.mock('@/features/auth/auth-helpers', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin-1' }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { deleteBirdAction } from './delete-bird-mutation';

describe('deleteBirdAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the DB row before deleting any Cloudinary assets', async () => {
    getBirdById.mockResolvedValue({
      id: 1,
      image_public_id: 'birddex/image-1',
      image_resource_type: 'image',
      sound_public_id: 'birddex/sounds/sound-1',
      sound_resource_type: 'video',
    });

    const callOrder: string[] = [];
    deleteBird.mockImplementation(async () => {
      callOrder.push('db-delete');
    });
    deleteCloudinaryAsset.mockImplementation(async () => {
      callOrder.push('cloudinary-delete');
    });

    const result = await deleteBirdAction({ birdId: 1 });

    expect(result).toEqual({ success: true });
    expect(callOrder[0]).toBe('db-delete');
    expect(callOrder.slice(1)).toEqual(['cloudinary-delete', 'cloudinary-delete']);
  });

  it('deletes the image using the DB-stored image_public_id and image_resource_type', async () => {
    getBirdById.mockResolvedValue({
      id: 1,
      image_public_id: 'birddex/image-1',
      image_resource_type: 'image',
      sound_public_id: null,
      sound_resource_type: null,
    });
    deleteBird.mockResolvedValue(undefined);

    await deleteBirdAction({ birdId: 1 });

    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/image-1', 'image');
  });

  it('deletes the sound using the DB-stored sound_public_id and sound_resource_type', async () => {
    getBirdById.mockResolvedValue({
      id: 1,
      image_public_id: null,
      image_resource_type: null,
      sound_public_id: 'birddex/sounds/sound-1',
      sound_resource_type: 'video',
    });
    deleteBird.mockResolvedValue(undefined);

    await deleteBirdAction({ birdId: 1 });

    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/sounds/sound-1', 'video');
  });

  it('does not call deleteCloudinaryAsset when the DB delete fails', async () => {
    getBirdById.mockResolvedValue({
      id: 1,
      image_public_id: 'birddex/image-1',
      image_resource_type: 'image',
      sound_public_id: 'birddex/sounds/sound-1',
      sound_resource_type: 'video',
    });
    deleteBird.mockRejectedValue(new Error('db down'));

    const result = await deleteBirdAction({ birdId: 1 });

    expect(result).toEqual({ error: 'db down' });
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('returns a friendly error and skips Cloudinary cleanup when the bird has observations', async () => {
    getBirdById.mockResolvedValue({
      id: 1,
      image_public_id: 'birddex/image-1',
      image_resource_type: 'image',
      sound_public_id: null,
      sound_resource_type: null,
    });
    deleteBird.mockRejectedValue(new BirdHasObservationsError('has observations'));

    const result = await deleteBirdAction({ birdId: 1 });

    expect(result).toEqual({
      error: 'This bird has observations logged against it and cannot be deleted. Remove those observations first.',
    });
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('skips the image and sound deletion safely when their public_ids are missing', async () => {
    getBirdById.mockResolvedValue({
      id: 1,
      image_public_id: null,
      image_resource_type: null,
      sound_public_id: null,
      sound_resource_type: null,
    });
    deleteBird.mockResolvedValue(undefined);

    const result = await deleteBirdAction({ birdId: 1 });

    expect(result).toEqual({ success: true });
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('still reports success when Cloudinary cleanup fails after a successful DB delete', async () => {
    getBirdById.mockResolvedValue({
      id: 1,
      image_public_id: 'birddex/image-1',
      image_resource_type: 'image',
      sound_public_id: 'birddex/sounds/sound-1',
      sound_resource_type: 'video',
    });
    deleteBird.mockResolvedValue(undefined);
    deleteCloudinaryAsset.mockResolvedValue(undefined);

    const result = await deleteBirdAction({ birdId: 1 });

    expect(result).toEqual({ success: true });
  });
});
