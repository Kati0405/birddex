import { describe, expect, it, vi, beforeEach } from 'vitest';

const { uploadCloudinaryBuffer, deleteCloudinaryAsset } = vi.hoisted(() => ({
  uploadCloudinaryBuffer: vi.fn(),
  deleteCloudinaryAsset: vi.fn(),
}));
vi.mock('@/shared/lib/cloudinary', () => ({
  uploadCloudinaryBuffer,
  deleteCloudinaryAsset,
}));

const { getBirdById, updateBirdCloudinaryImage } = vi.hoisted(() => ({
  getBirdById: vi.fn(),
  updateBirdCloudinaryImage: vi.fn(),
}));
vi.mock('@/features/birds/bird-queries', () => ({
  getBirdById,
  updateBirdCloudinaryImage,
}));

vi.mock('@/features/auth/auth-helpers', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin-1' }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

import { uploadBirdImageAction } from './cloudinary-upload';

function makeFormData(birdId: number, fileContent = 'fake-image-bytes') {
  const formData = new FormData();
  formData.set('birdId', String(birdId));
  formData.set('file', new File([fileContent], 'photo.jpg', { type: 'image/jpeg' }));
  return formData;
}

describe('uploadBirdImageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the NEW asset and leaves the OLD asset alone when the DB update fails', async () => {
    getBirdById.mockResolvedValue({
      id: 1,
      image_url: 'https://res.cloudinary.com/demo/image/upload/v1/birddex/old-public-id.jpg',
      image_public_id: 'birddex/old-public-id',
      image_resource_type: 'image',
      selected_image: null,
    });
    uploadCloudinaryBuffer.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/birddex/new-public-id.jpg',
      public_id: 'birddex/new-public-id',
    });
    updateBirdCloudinaryImage.mockRejectedValue(new Error('db down'));

    await expect(uploadBirdImageAction(makeFormData(1))).rejects.toThrow('db down');

    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/new-public-id', 'image');
    expect(deleteCloudinaryAsset).not.toHaveBeenCalledWith('birddex/old-public-id', expect.anything());
  });

  it('does not call the DB update or delete the old asset when the upload fails', async () => {
    getBirdById.mockResolvedValue({
      id: 1,
      image_url: 'https://res.cloudinary.com/demo/image/upload/v1/birddex/old-public-id.jpg',
      image_public_id: 'birddex/old-public-id',
      image_resource_type: 'image',
      selected_image: null,
    });
    uploadCloudinaryBuffer.mockRejectedValue(new Error('cloudinary unreachable'));

    await expect(uploadBirdImageAction(makeFormData(1))).rejects.toThrow('cloudinary unreachable');

    expect(updateBirdCloudinaryImage).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('deletes the old asset only after the DB update succeeds', async () => {
    getBirdById.mockResolvedValue({
      id: 1,
      image_url: 'https://res.cloudinary.com/demo/image/upload/v1/birddex/old-public-id.jpg',
      image_public_id: 'birddex/old-public-id',
      image_resource_type: 'image',
      selected_image: null,
    });
    uploadCloudinaryBuffer.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/birddex/new-public-id.jpg',
      public_id: 'birddex/new-public-id',
    });

    const callOrder: string[] = [];
    updateBirdCloudinaryImage.mockImplementation(async () => {
      callOrder.push('db-update');
    });
    deleteCloudinaryAsset.mockImplementation(async () => {
      callOrder.push('delete-old');
    });

    await expect(uploadBirdImageAction(makeFormData(1))).rejects.toThrow('NEXT_REDIRECT');

    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/old-public-id', 'image');
    expect(callOrder).toEqual(['db-update', 'delete-old']);
  });
});
