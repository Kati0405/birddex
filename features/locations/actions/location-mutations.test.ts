import { describe, expect, it, vi, beforeEach } from 'vitest';

const { uploadCloudinaryBuffer, deleteCloudinaryAsset } = vi.hoisted(() => ({
  uploadCloudinaryBuffer: vi.fn(),
  deleteCloudinaryAsset: vi.fn(),
}));
vi.mock('@/shared/lib/cloudinary', () => ({
  uploadCloudinaryBuffer,
  deleteCloudinaryAsset,
}));

const { saveLocation, deleteLocation, updateLocationPhoto, getSavedLocationById } = vi.hoisted(() => ({
  saveLocation: vi.fn(),
  deleteLocation: vi.fn(),
  updateLocationPhoto: vi.fn(),
  getSavedLocationById: vi.fn(),
}));
vi.mock('@/features/locations/location-queries', () => ({
  saveLocation,
  deleteLocation,
  updateLocationPhoto,
  updateLocation: vi.fn(),
  getSavedLocationById,
}));

const { requireAuth } = vi.hoisted(() => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));
vi.mock('@/features/auth/auth-helpers', () => ({
  requireAuth,
}));

const { createSupabaseServerClient, supabaseSingle } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  supabaseSingle: vi.fn(),
}));
vi.mock('@/shared/lib/supabase-server', () => ({
  createSupabaseServerClient,
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { saveLocationAction, deleteLocationAction, updateLocationPhotoAction } from './location-mutations';

function mockDeleteLocationSelect(photoPublicId: string | null) {
  const fromSpy = vi.fn();
  const selectSpy = vi.fn();
  const firstEqSpy = vi.fn();
  const secondEqSpy = vi.fn();

  supabaseSingle.mockResolvedValue({ data: { photo_public_id: photoPublicId } });
  secondEqSpy.mockReturnValue({ single: supabaseSingle });
  firstEqSpy.mockReturnValue({ eq: secondEqSpy });
  selectSpy.mockReturnValue({ eq: firstEqSpy });
  fromSpy.mockReturnValue({ select: selectSpy });
  createSupabaseServerClient.mockResolvedValue({ from: fromSpy });

  return { fromSpy, selectSpy, firstEqSpy, secondEqSpy };
}

const NEW_URL = 'https://res.cloudinary.com/demo/image/upload/v1/birddex/locations/new-public-id.jpg';
const OLD_URL = 'https://res.cloudinary.com/demo/image/upload/v1/birddex/locations/old-public-id.jpg';

function makeSaveFormData(overrides: { withFile?: boolean } = {}) {
  const formData = new FormData();
  formData.set('name', 'City Park');
  formData.set('lat', '40.7');
  formData.set('lng', '-73.9');
  formData.set('habitats', JSON.stringify([]));
  if (overrides.withFile) {
    formData.set('file', new File(['fake-image-bytes'], 'location.jpg', { type: 'image/jpeg' }));
  }
  return formData;
}

describe('saveLocationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads the photo before writing the DB row', async () => {
    uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_URL, public_id: 'birddex/locations/new-public-id' });
    const callOrder: string[] = [];
    uploadCloudinaryBuffer.mockImplementation(async () => {
      callOrder.push('upload');
      return { secure_url: NEW_URL, public_id: 'birddex/locations/new-public-id' };
    });
    saveLocation.mockImplementation(async () => {
      callOrder.push('db-insert');
    });

    const result = await saveLocationAction(makeSaveFormData({ withFile: true }));

    expect(result).toEqual({ success: true });
    expect(callOrder).toEqual(['upload', 'db-insert']);
    expect(saveLocation).toHaveBeenCalledWith(
      'City Park', 40.7, -73.9, NEW_URL, 'birddex/locations/new-public-id', [],
    );
  });

  it('deletes the uploaded asset when the DB insert fails', async () => {
    uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_URL, public_id: 'birddex/locations/new-public-id' });
    saveLocation.mockRejectedValue(new Error('db down'));

    const result = await saveLocationAction(makeSaveFormData({ withFile: true }));

    expect(result).toEqual({ error: 'db down' });
    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/locations/new-public-id', 'image');
  });

  it('does not call the DB or delete anything when the upload fails', async () => {
    uploadCloudinaryBuffer.mockRejectedValue(new Error('cloudinary unreachable'));

    const result = await saveLocationAction(makeSaveFormData({ withFile: true }));

    expect(result).toEqual({ error: 'cloudinary unreachable' });
    expect(saveLocation).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('saves without ever calling upload when no file is provided', async () => {
    saveLocation.mockResolvedValue(undefined);

    const result = await saveLocationAction(makeSaveFormData({ withFile: false }));

    expect(result).toEqual({ success: true });
    expect(uploadCloudinaryBuffer).not.toHaveBeenCalled();
    expect(saveLocation).toHaveBeenCalledWith('City Park', 40.7, -73.9, null, null, []);
  });
});

describe('updateLocationPhotoAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makePhotoFormData(id: number, withFile = true) {
    const formData = new FormData();
    formData.set('id', String(id));
    if (withFile) {
      formData.set('file', new File(['fake-image-bytes'], 'location.jpg', { type: 'image/jpeg' }));
    }
    return formData;
  }

  it('does not touch Cloudinary at all when the location is not found for this user', async () => {
    getSavedLocationById.mockResolvedValue(null);

    const result = await updateLocationPhotoAction(makePhotoFormData(999));

    expect(result).toEqual({ error: 'Location not found' });
    expect(uploadCloudinaryBuffer).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
    expect(updateLocationPhoto).not.toHaveBeenCalled();
  });

  it('fetches the location by id, deriving the old public_id from the DB — never from client input', async () => {
    getSavedLocationById.mockResolvedValue({
      id: 1, name: 'x', lat: 0, lng: 0, photoUrl: OLD_URL, photoPublicId: 'birddex/locations/old-public-id', habitats: [],
    });
    uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_URL, public_id: 'birddex/locations/new-public-id' });
    updateLocationPhoto.mockResolvedValue(undefined);

    const formData = makePhotoFormData(1);
    // Even if a malicious client stuffs extra fields into the FormData, the action
    // never reads a client-supplied public id for anything — it only reads id + file.
    formData.set('oldPhotoPublicId', 'someone-elses-public-id');
    formData.set('photoPublicId', 'someone-elses-public-id');

    await updateLocationPhotoAction(formData);

    expect(getSavedLocationById).toHaveBeenCalledWith(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/locations/old-public-id', 'image');
    expect(deleteCloudinaryAsset).not.toHaveBeenCalledWith('someone-elses-public-id', expect.anything());
  });

  it('uploads new first, writes DB second, deletes old third', async () => {
    getSavedLocationById.mockResolvedValue({
      id: 1, name: 'x', lat: 0, lng: 0, photoUrl: OLD_URL, photoPublicId: 'birddex/locations/old-public-id', habitats: [],
    });
    uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_URL, public_id: 'birddex/locations/new-public-id' });

    const callOrder: string[] = [];
    uploadCloudinaryBuffer.mockImplementation(async () => {
      callOrder.push('upload');
      return { secure_url: NEW_URL, public_id: 'birddex/locations/new-public-id' };
    });
    updateLocationPhoto.mockImplementation(async () => {
      callOrder.push('db-update');
    });
    deleteCloudinaryAsset.mockImplementation(async () => {
      callOrder.push('delete-old');
    });

    const result = await updateLocationPhotoAction(makePhotoFormData(1));

    expect(result).toEqual({ success: true, photoUrl: NEW_URL });
    expect(callOrder).toEqual(['upload', 'db-update', 'delete-old']);
    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/locations/old-public-id', 'image');
  });

  it('deletes the NEW asset and leaves the OLD asset alone when the DB update fails', async () => {
    getSavedLocationById.mockResolvedValue({
      id: 1, name: 'x', lat: 0, lng: 0, photoUrl: OLD_URL, photoPublicId: 'birddex/locations/old-public-id', habitats: [],
    });
    uploadCloudinaryBuffer.mockResolvedValue({ secure_url: NEW_URL, public_id: 'birddex/locations/new-public-id' });
    updateLocationPhoto.mockRejectedValue(new Error('db down'));

    const result = await updateLocationPhotoAction(makePhotoFormData(1));

    expect(result).toEqual({ error: 'db down' });
    expect(deleteCloudinaryAsset).toHaveBeenCalledTimes(1);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/locations/new-public-id', 'image');
    expect(deleteCloudinaryAsset).not.toHaveBeenCalledWith('birddex/locations/old-public-id', expect.anything());
  });

  it('does not call the DB or delete anything when the upload fails', async () => {
    getSavedLocationById.mockResolvedValue({
      id: 1, name: 'x', lat: 0, lng: 0, photoUrl: OLD_URL, photoPublicId: 'birddex/locations/old-public-id', habitats: [],
    });
    uploadCloudinaryBuffer.mockRejectedValue(new Error('cloudinary unreachable'));

    const result = await updateLocationPhotoAction(makePhotoFormData(1));

    expect(result).toEqual({ error: 'cloudinary unreachable' });
    expect(updateLocationPhoto).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('removing the photo deletes the DB-known public_id, not a client-supplied one', async () => {
    getSavedLocationById.mockResolvedValue({
      id: 1, name: 'x', lat: 0, lng: 0, photoUrl: OLD_URL, photoPublicId: 'birddex/locations/old-public-id', habitats: [],
    });
    updateLocationPhoto.mockResolvedValue(undefined);

    const formData = makePhotoFormData(1, false);
    formData.set('remove', 'true');
    formData.set('oldPhotoPublicId', 'someone-elses-public-id');

    const result = await updateLocationPhotoAction(formData);

    expect(result).toEqual({ success: true, photoUrl: null });
    expect(updateLocationPhoto).toHaveBeenCalledWith(1, null, null);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/locations/old-public-id', 'image');
    expect(uploadCloudinaryBuffer).not.toHaveBeenCalled();
  });
});

describe('deleteLocationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ id: 'user-1' });
  });

  it('scopes the photo_public_id lookup to the current user before deleting', async () => {
    const { fromSpy, selectSpy, firstEqSpy, secondEqSpy } = mockDeleteLocationSelect('birddex/locations/old-public-id');
    deleteLocation.mockResolvedValue(undefined);

    await deleteLocationAction({ id: 1 });

    expect(fromSpy).toHaveBeenCalledWith('saved_locations');
    expect(selectSpy).toHaveBeenCalledWith('photo_public_id');
    expect(firstEqSpy).toHaveBeenCalledWith('id', 1);
    expect(secondEqSpy).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('deletes the DB row before deleting the Cloudinary asset', async () => {
    mockDeleteLocationSelect('birddex/locations/old-public-id');
    const callOrder: string[] = [];
    deleteLocation.mockImplementation(async () => {
      callOrder.push('db-delete');
    });
    deleteCloudinaryAsset.mockImplementation(async () => {
      callOrder.push('cloudinary-delete');
    });

    const result = await deleteLocationAction({ id: 1 });

    expect(result).toEqual({ success: true });
    expect(callOrder).toEqual(['db-delete', 'cloudinary-delete']);
    expect(deleteCloudinaryAsset).toHaveBeenCalledWith('birddex/locations/old-public-id', 'image');
  });

  it('does not call Cloudinary delete when the location had no photo', async () => {
    mockDeleteLocationSelect(null);
    deleteLocation.mockResolvedValue(undefined);

    const result = await deleteLocationAction({ id: 1 });

    expect(result).toEqual({ success: true });
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('does not delete the Cloudinary asset if the DB delete fails', async () => {
    mockDeleteLocationSelect('birddex/locations/old-public-id');
    deleteLocation.mockRejectedValue(new Error('db down'));

    const result = await deleteLocationAction({ id: 1 });

    expect(result).toEqual({ error: 'db down' });
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });

  it('rejects an invalid id before touching the DB or Cloudinary', async () => {
    const result = await deleteLocationAction({ id: -1 });

    expect('error' in result).toBe(true);
    expect(requireAuth).not.toHaveBeenCalled();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(deleteLocation).not.toHaveBeenCalled();
    expect(deleteCloudinaryAsset).not.toHaveBeenCalled();
  });
});
