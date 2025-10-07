import { v2 as cloudinary } from 'cloudinary';
import { env } from '../utils/env.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env('CLOUDINARY_CLOUD_NAME'),
  api_key: env('CLOUDINARY_API_KEY'),
  api_secret: env('CLOUDINARY_API_SECRET'),
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder path
 * @param {string} fileName - Custom filename (without extension)
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadToCloudinary = (fileBuffer, folder, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName,
        resource_type: 'image',
        format: 'jpg', // Convert all images to jpg
        transformation: [
          { quality: 'auto:good' }, // Auto optimize quality
          { fetch_format: 'auto' }, // Auto format
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      },
    );

    // Write buffer to upload stream
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error.message);
    // Don't throw error - we don't want to break the flow if delete fails
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // Extract public_id from URL
    // Example: https://res.cloudinary.com/ddapxuvn7/image/upload/v1234567890/TripleGeneralAPI/applications/passport_1_1234567890.jpg
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const pathParts = parts[1].split('/');
    // Remove version (v1234567890) if exists
    const relevantParts = pathParts.filter((part) => !part.startsWith('v'));

    // Join back without extension
    const publicIdWithExt = relevantParts.join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension

    return publicId;
  } catch (error) {
    console.error('Failed to extract public ID from URL:', error.message);
    return null;
  }
};

export default cloudinary;
