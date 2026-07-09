import { describe, expect, it, vi, beforeEach } from 'vitest';

const { uploadCloudinaryBuffer, deleteCloudinaryAsset } = vi.hoisted(() => ({
  uploadCloudinaryBuffer: vi.fn(),
  deleteCloudinaryAsset: vi.fn(),
}));
vi.mock('@/shared/lib/cloudinary', () => ({
  uploadCloudinaryBuffer,
  deleteCloudinaryAsset,
}));

const { getBirdById, updateBirdSelectedImage, updateBirdCloudinaryImage, updateBirdSoundUrl, updateBirdMetadata } = vi.hoisted(() => ({
  getBirdById: vi.fn(),
  updateBirdSelectedImage: vi.fn(),
  updateBirdCloudinaryImage: vi.fn(),
  updateBirdSoundUrl: vi.fn(),
  updateBirdMetadata: vi.fn(),
}));
vi.mock('@/features/birds/bird-queries', () => ({
  getBirdById,
  updateBirdSelectedImage,
  updateBirdCloudinaryImage,
  updateBirdSoundUrl,
  updateBirdMetadata,
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

import {
  updateBirdImageAction,
  updateBirdSoundUrlAction,
  updateBirdSoundFileAction,
} from './bird-mutations';

const OLD_IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/v1/birddex/old-public-id.jpg';
const NEW_IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/v1/birddex/new-public-id.jpg';
const OLD_SOUND_URL = 'https://res.cloudinary.com/demo/video/upload/v1/birddex/sounds/old-sound-id.mp3';
const NEW_SOUND_URL = 'https://res.cloudinary.com/demo/video/upload/v1/birddex/sounds/new-sound-id.mp3';

function mockImageFetch(body = 'fake-image-bytes', contentType = 'image/jpeg') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': contentType, 'content-length': String(body.length) }),
      arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    }),
  );
}

const selectedImageInput = {
  birdId: 1,
  selectedImage: {
    imageUrl: 'https://upload.wikimedia.org/photo.jpg',
    thumbnailUrl: 'https://upload.wikimedia.org/thumb.jpg',
    author: 'Someone',
    license: 'CC-BY',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:photo.jpg',
  },
};

describe('updateBirdImageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockImageFetch();
  });

  it('deletes the NEW asset and leaves the OLD asset alone when the DB update fails', async () => {
    getBirdById.mockResolvedValue({ id: 1, image_url: OLD_IMAGE_URL, image_public_id: 'birddex/old-public-id', image_resource_type: 'image', selected_image: null });
    uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_IMAGE_URL, public_id: 'birddex/new-public-id' });
    updateBirdSelectedImage.mockRejectedValue(new Error('db down'));

    await expect(updateBirdImageAction(selectedImageInput)).rejects.toThrow('db down');

    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/new-public-id', 'image');
    expect(deleteCloudinaryAsset).not.toHaveBeenCalledWith('birddex/old-public-id', expect.anything());
  });

  it('does not call the DB update or delete the old asset when the upload fails', async () => {
    getBirdById.mockResolvedValue({ id: 1, image_url: OLD_IMAGE_URL, image_public_id: 'birddex/old-public-id', image_resource_type: 'image', selected_image: null });
    uploadCloudinaryBuffer.mockRejectedValue(new Error('cloudinary unreachable'));

    const result = await updateBirdImageAction(selectedImageInput);

    expect(result).toEqual({ error: expect.stringContaining('Cloudinary upload failed') });
    expect(updateBirdSelectedImage).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('deletes the old asset only after the DB update succeeds', async () => {
    getBirdById.mockResolvedValue({ id: 1, image_url: OLD_IMAGE_URL, image_public_id: 'birddex/old-public-id', image_resource_type: 'image', selected_image: null });
    uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_IMAGE_URL, public_id: 'birddex/new-public-id' });

    const callOrder: string[] = [];
    updateBirdSelectedImage.mockImplementation(async () => {
      callOrder.push('db-update');
    });
    deleteCloudinaryAsset.mockImplementation(async () => {
      callOrder.push('delete-old');
    });

    await expect(updateBirdImageAction(selectedImageInput)).rejects.toThrow('NEXT_REDIRECT');

    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/old-public-id', 'image');
    expect(callOrder).toEqual(['db-update', 'delete-old']);
  });

  it('rejects an unsupported content-type before uploading or touching the DB', async () => {
    getBirdById.mockResolvedValue({ id: 1, image_url: OLD_IMAGE_URL, image_public_id: 'birddex/old-public-id', image_resource_type: 'image', selected_image: null });
    mockImageFetch('<svg></svg>', 'image/svg+xml');

    const result = await updateBirdImageAction(selectedImageInput);

    expect(result).toEqual({ error: expect.stringContaining('Unsupported image type') });
    expect(uploadCloudinaryBuffer).not.toHaveBeenCalled();
    expect(updateBirdSelectedImage).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('rejects an oversized image before uploading or touching the DB', async () => {
    getBirdById.mockResolvedValue({ id: 1, image_url: OLD_IMAGE_URL, image_public_id: 'birddex/old-public-id', image_resource_type: 'image', selected_image: null });
    mockImageFetch('x', 'image/jpeg');
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg', 'content-length': String(11 * 1024 * 1024) }),
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Response);

    const result = await updateBirdImageAction(selectedImageInput);

    expect(result).toEqual({ error: expect.stringContaining('too large') });
    expect(uploadCloudinaryBuffer).not.toHaveBeenCalled();
    expect(updateBirdSelectedImage).not.toHaveBeenCalled();
  });
});

describe('sound replacement (updateBirdSoundUrlAction / updateBirdSoundFileAction)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each([
    {
      name: 'updateBirdSoundUrlAction',
      run: () => {
        mockImageFetch('fake-sound-bytes', 'audio/mpeg');
        return updateBirdSoundUrlAction({ birdId: 1, soundUrl: 'https://example.com/sound.mp3' });
      },
    },
    {
      name: 'updateBirdSoundFileAction',
      run: () => {
        const formData = new FormData();
        formData.set('birdId', '1');
        formData.set('file', new File(['fake-sound-bytes'], 'sound.mp3', { type: 'audio/mpeg' }));
        return updateBirdSoundFileAction(formData);
      },
    },
  ])('$name', ({ run }) => {
    it('deletes the NEW asset and leaves the OLD asset alone when the DB update fails', async () => {
      getBirdById.mockResolvedValue({ id: 1, sound_url: OLD_SOUND_URL, sound_public_id: 'birddex/sounds/old-sound-id', sound_resource_type: 'video' });
      uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_SOUND_URL, public_id: 'birddex/sounds/new-sound-id' });
      updateBirdSoundUrl.mockRejectedValue(new Error('db down'));

      await expect(run()).rejects.toThrow('db down');

      expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
      expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/sounds/new-sound-id', 'video');
      expect(deleteCloudinaryAsset).not.toHaveBeenCalledWith('birddex/sounds/old-sound-id', expect.anything());
    });

    it('does not call the DB update or delete the old asset when the upload fails', async () => {
      getBirdById.mockResolvedValue({ id: 1, sound_url: OLD_SOUND_URL, sound_public_id: 'birddex/sounds/old-sound-id', sound_resource_type: 'video' });
      uploadCloudinaryBuffer.mockRejectedValue(new Error('cloudinary unreachable'));

      const result = await run();

      expect(result).toEqual({ error: expect.stringContaining('Cloudinary upload failed') });
      expect(updateBirdSoundUrl).not.toHaveBeenCalled();
      expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    });

    it('deletes the old asset only after the DB update succeeds', async () => {
      getBirdById.mockResolvedValue({ id: 1, sound_url: OLD_SOUND_URL, sound_public_id: 'birddex/sounds/old-sound-id', sound_resource_type: 'video' });
      uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_SOUND_URL, public_id: 'birddex/sounds/new-sound-id' });

      const callOrder: string[] = [];
      updateBirdSoundUrl.mockImplementation(async () => {
        callOrder.push('db-update');
      });
      deleteCloudinaryAsset.mockImplementation(async () => {
        callOrder.push('delete-old');
      });

      const result = await run();

      expect(result).toEqual({ success: true, soundUrl: NEW_SOUND_URL });
      expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
      expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/sounds/old-sound-id', 'video');
      expect(callOrder).toEqual(['db-update', 'delete-old']);
    });
  });
});
