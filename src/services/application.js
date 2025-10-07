import createHttpError from 'http-errors';

import { Application } from '../models/Application.js';
import { User } from '../models/auth/User.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from '../config/cloudinary.js';

/**
 * Upload file to Cloudinary
 * @param {Object} file - Multer file object
 * @param {number} userId - User ID
 * @param {string} type - File type (passport, user, signature)
 * @returns {Promise<string|null>} - Cloudinary URL or null
 */
const uploadFile = async (file, userId, type) => {
  if (!file) return null;

  const fileName = `${type}_${userId}_${Date.now()}`;
  const folder = 'TripleGeneralAPI/applications';

  try {
    const result = await uploadToCloudinary(file.buffer, folder, fileName);
    return result.url;
  } catch (error) {
    console.error(`Failed to upload ${type} to Cloudinary:`, error.message);
    throw createHttpError(
      500,
      `Не вдалося завантажити ${
        type === 'passport'
          ? 'фото паспорту'
          : type === 'user'
          ? 'фото користувача'
          : 'цифровий підпис'
      }`,
    );
  }
};

/**
 * Process digital signature (can be text or file)
 * @param {string} digitalSignature - Text value or undefined
 * @param {Object} files - Multer files object
 * @param {number} userId - User ID
 * @returns {Promise<string|null>}
 */
const processDigitalSignature = async (digitalSignature, files, userId) => {
  // If digitalSignature is a file (from files object)
  if (files?.digitalSignature?.[0]) {
    return await uploadFile(files.digitalSignature[0], userId, 'signature');
  }

  // If digitalSignature is a text value (like "true")
  if (digitalSignature) {
    return digitalSignature;
  }

  return null;
};

/**
 * Delete files from Cloudinary when application is deleted
 * @param {Object} application - Application object with file URLs
 */
const deleteApplicationFiles = async (application) => {
  const urlsToDelete = [
    application.passport_photo_url,
    application.user_photo_url,
    application.digital_signature_url,
  ];

  for (const url of urlsToDelete) {
    if (url && url.includes('cloudinary.com')) {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }
  }
};

export const createApplication = async (userId, applicationData, files) => {
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw createHttpError(404, 'Користувач не знайдений');
  }

  if (user.banned) {
    throw createHttpError(403, 'Ваш аккаунт заблокований');
  }

  // Check if user already has an application
  const existingApplication = await Application.findByUserId(userId);
  if (existingApplication) {
    throw createHttpError(409, 'У вас вже є подана анкета');
  }

  // Save uploaded files to Cloudinary
  const passportPhotoUrl = await uploadFile(
    files?.passportPhoto?.[0],
    userId,
    'passport',
  );
  const userPhotoUrl = await uploadFile(files?.userPhoto?.[0], userId, 'user');
  const digitalSignatureUrl = await processDigitalSignature(
    applicationData.digitalSignature,
    files,
    userId,
  );

  // Create application with file URLs
  const applicationId = await Application.create({
    userId,
    passportPhotoUrl,
    userPhotoUrl,
    digitalSignatureUrl,
    ...applicationData,
  });

  const newApplication = await Application.findById(applicationId);

  return {
    id: newApplication.id,
    firstName: newApplication.first_name,
    lastName: newApplication.last_name,
    patronymic: newApplication.patronymic,
    birthDate: newApplication.birth_date,
    passportSeries: newApplication.passport_series,
    passportNumber: newApplication.passport_number,
    issuingAuthority: newApplication.issuing_authority,
    placeOfResidence: newApplication.place_of_residence,
    passportPhotoUrl: newApplication.passport_photo_url,
    userPhotoUrl: newApplication.user_photo_url,
    digitalSignatureUrl: newApplication.digital_signature_url,
    status: newApplication.status,
    createdAt: newApplication.created_at,
  };
};

export const getMyApplication = async (userId) => {
  const application = await Application.findByUserId(userId);

  if (!application) {
    throw createHttpError(404, 'Анкета не знайдена');
  }

  return {
    id: application.id,
    firstName: application.first_name,
    lastName: application.last_name,
    patronymic: application.patronymic,
    birthDate: application.birth_date,
    passportSeries: application.passport_series,
    passportNumber: application.passport_number,
    issuingAuthority: application.issuing_authority,
    placeOfResidence: application.place_of_residence,
    passportPhotoUrl: application.passport_photo_url,
    userPhotoUrl: application.user_photo_url,
    digitalSignatureUrl: application.digital_signature_url,
    status: application.status,
    createdAt: application.created_at,
    updatedAt: application.updated_at,
    processedAt: application.processed_at,
    rejectionReason: application.rejection_reason,
  };
};

export const getApplicationById = async (applicationId) => {
  const application = await Application.findById(applicationId);

  if (!application) {
    throw createHttpError(404, 'Анкета не знайдена');
  }

  return {
    id: application.id,
    userId: application.user_id,
    firstName: application.first_name,
    lastName: application.last_name,
    patronymic: application.patronymic,
    birthDate: application.birth_date,
    passportSeries: application.passport_series,
    passportNumber: application.passport_number,
    issuingAuthority: application.issuing_authority,
    placeOfResidence: application.place_of_residence,
    passportPhotoUrl: application.passport_photo_url,
    userPhotoUrl: application.user_photo_url,
    digitalSignatureUrl: application.digital_signature_url,
    status: application.status,
    createdAt: application.created_at,
    updatedAt: application.updated_at,
    processedAt: application.processed_at,
    processedBy: application.processed_by,
    rejectionReason: application.rejection_reason,
  };
};

export const getAllApplications = async (filters = {}) => {
  const result = await Application.getAll(filters);

  return {
    applications: result.applications.map((app) => ({
      id: app.id,
      userId: app.user_id,
      username: app.username,
      email: app.email,
      firstName: app.first_name,
      lastName: app.last_name,
      patronymic: app.patronymic,
      birthDate: app.birth_date,
      passportSeries: app.passport_series,
      passportNumber: app.passport_number,
      issuingAuthority: app.issuing_authority,
      placeOfResidence: app.place_of_residence,
      passportPhotoUrl: app.passport_photo_url,
      userPhotoUrl: app.user_photo_url,
      digitalSignatureUrl: app.digital_signature_url,
      status: app.status,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
      processedAt: app.processed_at,
      processedBy: app.processed_by,
      processorUsername: app.processor_username,
      rejectionReason: app.rejection_reason,
    })),
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  };
};

export const updateApplicationStatus = async (
  applicationId,
  status,
  adminId,
  rejectionReason = null,
) => {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw createHttpError(404, 'Анкета не знайдена');
  }

  const allowedStatuses = ['pending', 'approved', 'rejected'];
  if (!allowedStatuses.includes(status)) {
    throw createHttpError(400, 'Неправильний статус');
  }

  if (status === 'rejected' && !rejectionReason) {
    throw createHttpError(400, "Причина відхилення обов'язкова");
  }

  const updated = await Application.updateStatus(
    applicationId,
    status,
    adminId,
    rejectionReason,
  );
  if (!updated) {
    throw createHttpError(500, 'Не вдалося оновити статус анкети');
  }

  // Log admin action
  console.log(
    `[ADMIN ACTION] Admin ID ${adminId} changed application ${applicationId} status to ${status}` +
      (rejectionReason ? ` with reason: ${rejectionReason}` : ''),
  );

  // If approved, update user's passport_valid field
  if (status === 'approved') {
    await User.updatePassportValid(application.user_id, true);
    console.log(
      `[ADMIN ACTION] User ID ${application.user_id} passport verified by admin ${adminId}`,
    );
  } else if (status === 'rejected') {
    await User.updatePassportValid(application.user_id, false);
  }

  return {
    message: 'Статус анкети успішно оновлено',
    status,
  };
};

/**
 * Delete application with all files from Cloudinary
 * @param {number} applicationId - Application ID
 * @returns {Promise<{message: string}>}
 */
export const deleteApplication = async (applicationId) => {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw createHttpError(404, 'Анкета не знайдена');
  }

  // Delete files from Cloudinary
  await deleteApplicationFiles(application);

  // Delete application from database
  const deleted = await Application.delete(applicationId);
  if (!deleted) {
    throw createHttpError(500, 'Не вдалося видалити анкету');
  }

  // Log deletion
  console.log(
    `[ADMIN ACTION] Application ${applicationId} (User ID: ${application.user_id}) deleted`,
  );

  return {
    message: 'Анкету успішно видалено',
  };
};
