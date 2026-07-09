import { describe, expect, it, vi, beforeEach } from 'vitest';

const { uploadCloudinaryBuffer, deleteCloudinaryAsset } = vi.hoisted(() => ({
  uploadCloudinaryBuffer: vi.fn(),
  deleteCloudinaryAsset: vi.fn(),
}));
vi.mock('@/shared/lib/cloudinary', () => ({
  uploadCloudinaryBuffer,
  deleteCloudinaryAsset,
}));

const { addObservation, updateObservation, deleteObservation, getObservationForUser } = vi.hoisted(() => ({
  addObservation: vi.fn(),
  updateObservation: vi.fn(),
  deleteObservation: vi.fn(),
  getObservationForUser: vi.fn(),
}));
vi.mock('@/features/observations/observation-queries', () => ({
  addObservation,
  updateObservation,
  deleteObservation,
  getObservationForUser,
}));

vi.mock('@/features/auth/auth-helpers', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { addObservationAction, updateObservationAction, deleteObservationAction } from './observation-mutations';

const NEW_URL = 'https://res.cloudinary.com/demo/image/upload/v1/birddex/observations/new-public-id.jpg';
const OLD_URL = 'https://res.cloudinary.com/demo/image/upload/v1/birddex/observations/old-public-id.jpg';
const OBS_ID = '11111111-1111-4111-8111-111111111111';

function makeFields(formData: FormData) {
  formData.set('observedAt', new Date('2026-01-01').toISOString());
  formData.set('seen', 'true');
  formData.set('heard', 'false');
  formData.set('photographed', 'true');
}

describe('addObservationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads the photo before writing the DB row', async () => {
    const callOrder: string[] = [];
    uploadCloudinaryBuffer.mockImplementation(async () => {
      callOrder.push('upload');
      return { secure_url: NEW_URL, public_id: 'birddex/observations/new-public-id' };
    });
    addObservation.mockImplementation(async () => {
      callOrder.push('db-insert');
    });

    const formData = new FormData();
    makeFields(formData);
    formData.set('birdId', '5');
    formData.set('file', new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' }));

    const result = await addObservationAction(formData);

    expect(result).toEqual({ success: true, photoUrl: NEW_URL });
    expect(callOrder).toEqual(['upload', 'db-insert']);
    expect(addObservation).toHaveBeenCalledWith(
      expect.objectContaining({
        birdId: 5,
        photoUrl: NEW_URL,
        photoPublicId: 'birddex/observations/new-public-id',
        photoResourceType: 'image',
      }),
    );
  });

  it('deletes the uploaded asset when the DB insert fails', async () => {
    uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_URL, public_id: 'birddex/observations/new-public-id' });
    addObservation.mockRejectedValue(new Error('db down'));

    const formData = new FormData();
    makeFields(formData);
    formData.set('birdId', '5');
    formData.set('file', new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' }));

    const result = await addObservationAction(formData);

    expect(result).toEqual({ error: 'db down' });
    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/observations/new-public-id', 'image');
  });

  it('does not call the DB or delete anything when the upload fails', async () => {
    uploadCloudinaryBuffer.mockRejectedValue(new Error('cloudinary unreachable'));

    const formData = new FormData();
    makeFields(formData);
    formData.set('birdId', '5');
    formData.set('file', new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' }));

    const result = await addObservationAction(formData);

    expect(result).toEqual({ error: 'cloudinary unreachable' });
    expect(addObservation).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('saves without calling upload when no file is provided', async () => {
    addObservation.mockResolvedValue(undefined);

    const formData = new FormData();
    makeFields(formData);
    formData.set('birdId', '5');

    const result = await addObservationAction(formData);

    expect(result).toEqual({ success: true, photoUrl: null });
    expect(uploadCloudinaryBuffer).not.toHaveBeenCalled();
    expect(addObservation).toHaveBeenCalledWith(
      expect.objectContaining({ photoUrl: null, photoPublicId: null, photoResourceType: null }),
    );
  });
});

describe('updateObservationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeUpdateFormData(withFile = true) {
    const formData = new FormData();
    makeFields(formData);
    formData.set('id', OBS_ID);
    if (withFile) {
      formData.set('file', new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' }));
    }
    return formData;
  }

  it('does not touch Cloudinary at all when the observation does not belong to the current user', async () => {
    getObservationForUser.mockResolvedValue(null);

    const result = await updateObservationAction(makeUpdateFormData());

    expect(result).toEqual({ error: 'Observation not found' });
    expect(uploadCloudinaryBuffer).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    expect(updateObservation).not.toHaveBeenCalled();
  });

  it('verifies ownership before uploading — getObservationForUser is called before any upload', async () => {
    getObservationForUser.mockResolvedValue({
      id: OBS_ID, photoUrl: OLD_URL, photoPublicId: 'birddex/observations/old-public-id', photoResourceType: 'image',
    });
    uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_URL, public_id: 'birddex/observations/new-public-id' });
    updateObservation.mockResolvedValue(undefined);

    const callOrder: string[] = [];
    getObservationForUser.mockImplementation(async () => {
      callOrder.push('ownership-check');
      return { id: OBS_ID, photoUrl: OLD_URL, photoPublicId: 'birddex/observations/old-public-id', photoResourceType: 'image' };
    });
    uploadCloudinaryBuffer.mockImplementation(async () => {
      callOrder.push('upload');
      return { secure_url: NEW_URL, public_id: 'birddex/observations/new-public-id' };
    });

    await updateObservationAction(makeUpdateFormData());

    expect(callOrder).toEqual(['ownership-check', 'upload']);
  });

  it('uploads new first, writes DB second, deletes old third', async () => {
    getObservationForUser.mockResolvedValue({
      id: OBS_ID, photoUrl: OLD_URL, photoPublicId: 'birddex/observations/old-public-id', photoResourceType: 'image',
    });
    const callOrder: string[] = [];
    uploadCloudinaryBuffer.mockImplementation(async () => {
      callOrder.push('upload');
      return { secure_url: NEW_URL, public_id: 'birddex/observations/new-public-id' };
    });
    updateObservation.mockImplementation(async () => {
      callOrder.push('db-update');
    });
    deleteCloudinaryAsset.mockImplementation(async () => {
      callOrder.push('delete-old');
    });

    const result = await updateObservationAction(makeUpdateFormData());

    expect(result).toEqual({ success: true, photoUrl: NEW_URL });
    expect(callOrder).toEqual(['upload', 'db-update', 'delete-old']);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/observations/old-public-id', 'image');
  });

  it('deletes the NEW asset and leaves the OLD asset alone when the DB update fails', async () => {
    getObservationForUser.mockResolvedValue({
      id: OBS_ID, photoUrl: OLD_URL, photoPublicId: 'birddex/observations/old-public-id', photoResourceType: 'image',
    });
    uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_URL, public_id: 'birddex/observations/new-public-id' });
    updateObservation.mockRejectedValue(new Error('db down'));

    const result = await updateObservationAction(makeUpdateFormData());

    expect(result).toEqual({ error: 'db down' });
    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/observations/new-public-id', 'image');
    expect(deleteCloudinaryAsset).not.toHaveBeenCalledWith('birddex/observations/old-public-id', expect.anything());
  });

  it('does not call the DB or delete anything when the upload fails', async () => {
    getObservationForUser.mockResolvedValue({
      id: OBS_ID, photoUrl: OLD_URL, photoPublicId: 'birddex/observations/old-public-id', photoResourceType: 'image',
    });
    uploadCloudinaryBuffer.mockRejectedValue(new Error('cloudinary unreachable'));

    const result = await updateObservationAction(makeUpdateFormData());

    expect(result).toEqual({ error: 'cloudinary unreachable' });
    expect(updateObservation).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('removing the photo deletes the DB-known public_id', async () => {
    getObservationForUser.mockResolvedValue({
      id: OBS_ID, photoUrl: OLD_URL, photoPublicId: 'birddex/observations/old-public-id', photoResourceType: 'image',
    });
    updateObservation.mockResolvedValue(undefined);

    const formData = makeUpdateFormData(false);
    formData.set('removePhoto', 'true');

    const result = await updateObservationAction(formData);

    expect(result).toEqual({ success: true, photoUrl: null });
    expect(updateObservation).toHaveBeenCalledWith(
      OBS_ID,
      expect.objectContaining({ photoUrl: null, photoPublicId: null, photoResourceType: null }),
    );
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/observations/old-public-id', 'image');
    expect(uploadCloudinaryBuffer).not.toHaveBeenCalled();
  });
});

describe('deleteObservationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not delete anything when the observation does not belong to the current user', async () => {
    getObservationForUser.mockResolvedValue(null);

    const result = await deleteObservationAction({ id: OBS_ID });

    expect(result).toEqual({ error: 'Observation not found' });
    expect(deleteObservation).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('deletes the Cloudinary asset using the stored public_id after the DB delete succeeds', async () => {
    getObservationForUser.mockResolvedValue({
      id: OBS_ID, photoUrl: OLD_URL, photoPublicId: 'birddex/observations/old-public-id', photoResourceType: 'image',
    });
    const callOrder: string[] = [];
    deleteObservation.mockImplementation(async () => {
      callOrder.push('db-delete');
    });
    deleteCloudinaryAsset.mockImplementation(async () => {
      callOrder.push('cloudinary-delete');
    });

    const result = await deleteObservationAction({ id: OBS_ID });

    expect(result).toEqual({ success: true });
    expect(callOrder).toEqual(['db-delete', 'cloudinary-delete']);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/observations/old-public-id', 'image');
  });

  it('does not call Cloudinary delete when the observation had no photo', async () => {
    getObservationForUser.mockResolvedValue({
      id: OBS_ID, photoUrl: null, photoPublicId: null, photoResourceType: null,
    });
    deleteObservation.mockResolvedValue(undefined);

    const result = await deleteObservationAction({ id: OBS_ID });

    expect(result).toEqual({ success: true });
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('does not delete the Cloudinary asset if the DB delete fails', async () => {
    getObservationForUser.mockResolvedValue({
      id: OBS_ID, photoUrl: OLD_URL, photoPublicId: 'birddex/observations/old-public-id', photoResourceType: 'image',
    });
    deleteObservation.mockRejectedValue(new Error('db down'));

    const result = await deleteObservationAction({ id: OBS_ID });

    expect(result).toEqual({ error: 'db down' });
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });
});
