import 'server-only';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiOptions } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export function uploadCloudinaryBuffer(
  buffer: Buffer,
  options: UploadApiOptions,
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (err, res) => {
        if (err || !res) return reject(err ?? new Error('Upload failed'));
        resolve({ secure_url: res.secure_url, public_id: res.public_id });
      })
      .end(buffer);
  });
}

export function deleteCloudinaryAsset(
  publicId: string,
  resourceType: UploadApiOptions['resource_type'] = 'image',
): Promise<void> {
  return cloudinary.uploader
    .destroy(publicId, { resource_type: resourceType })
    .then(() => undefined)
    .catch((err) => {
      console.error(`deleteCloudinaryAsset(${publicId}, ${resourceType}) failed:`, err);
    });
}
