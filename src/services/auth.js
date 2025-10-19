import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

import { User } from '../models/auth/User.js';
import { Session } from '../models/auth/Session.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../config/cloudinary.js';
import { env } from '../utils/env.js';

const JWT_SECRET = env('JWT_SECRET');

// Generate JWT tokens
const generateTokens = (userId) => {
  const payload = { userId };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  const accessTokenValidUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  const refreshTokenValidUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  };
};

export const registerUser = async (userData) => {
  const { nickname, email, password } = userData;

  // Check if user already exists
  const existingUserByEmail = await User.findByEmail(email);
  if (existingUserByEmail) {
    throw createHttpError(409, 'Користувач з таким email вже існує');
  }

  const existingUserByNickname = await User.findByUsername(nickname);
  if (existingUserByNickname) {
    throw createHttpError(409, 'Користувач з таким нікнеймом вже існує');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const userId = await User.create({
    username: nickname,
    email,
    password: hashedPassword,
  });

  // Generate tokens
  const tokens = generateTokens(userId);

  // Create session
  await Session.create({
    userId,
    ...tokens,
  });

  const user = await User.findById(userId);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      surname: user.surname,
      photo: user.photo,
      balance: user.balance,
      passportValid: user.passport_valid,
      isAdmin: user.is_admin,
      lastOnline: user.last_online,
      isOnline: user.is_online,
      banned: user.banned,
    },
    ...tokens,
  };
};

export const loginUser = async ({ emailOrNickname, password }) => {
  // Find user by email or nickname
  let user = await User.findByEmail(emailOrNickname);
  if (!user) {
    user = await User.findByUsername(emailOrNickname);
  }

  if (!user) {
    throw createHttpError(401, 'Невірний логін або пароль');
  }

  // Check if user is banned
  if (user.banned) {
    throw createHttpError(403, 'Ваш акаунт заблоковано');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createHttpError(401, 'Невірний логін або пароль');
  }

  // Delete old sessions for this user
  await Session.deleteByUserId(user.id);

  // Generate new tokens
  const tokens = generateTokens(user.id);

  // Create new session
  await Session.create({
    userId: user.id,
    ...tokens,
  });

  // Update last online
  await User.updateLastOnline(user.id);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      surname: user.surname,
      photo: user.photo,
      balance: user.balance,
      passportValid: user.passport_valid,
      isAdmin: user.is_admin,
      lastOnline: user.last_online,
      isOnline: user.is_online,
      banned: user.banned,
    },
    ...tokens,
  };
};

export const refreshUserTokens = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, JWT_SECRET);
  } catch (error) {
    throw createHttpError(401, 'Refresh token недійсний');
  }

  const session = await Session.findByRefreshToken(refreshToken);
  if (!session) {
    throw createHttpError(401, 'Сесія не знайдена');
  }

  const isRefreshTokenExpired =
    new Date() > new Date(session.refresh_token_valid_until);
  if (isRefreshTokenExpired) {
    await Session.deleteById(session.id);
    throw createHttpError(401, 'Refresh token прострочений');
  }

  const user = await User.findById(session.user_id);
  if (!user) {
    await Session.deleteById(session.id);
    throw createHttpError(401, 'Користувача не знайдено');
  }

  if (user.banned) {
    await Session.deleteById(session.id);
    throw createHttpError(403, 'Ваш акаунт заблоковано');
  }

  // Generate new tokens
  const newTokens = generateTokens(user.id);

  // Update session
  await Session.updateTokens(session.id, newTokens);

  // Update last online
  await User.updateLastOnline(user.id);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      surname: user.surname,
      photo: user.photo,
      balance: user.balance,
      passportValid: user.passport_valid,
      isAdmin: user.is_admin,
      lastOnline: user.last_online,
      isOnline: user.is_online,
      banned: user.banned,
    },
    ...newTokens,
  };
};

export const updateProfilePhoto = async (userId, file) => {
  if (!file) {
    throw createHttpError(400, 'Фото профілю обов\'язкове');
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw createHttpError(400, 'Підтримуються лише JPEG та PNG файли');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw createHttpError(404, 'Користувача не знайдено');
  }

  const previousPhotoUrl = user.photo;
  const fileName = `profile_${userId}_${Date.now()}`;
  const folder = 'TripleGeneralAPI/users';

  let uploadResult;
  try {
    uploadResult = await uploadToCloudinary(file.buffer, folder, fileName);
  } catch (error) {
    console.error('Failed to upload profile photo to Cloudinary:', error.message);
    throw createHttpError(500, 'Не вдалося завантажити фото профілю');
  }

  const newPhotoUrl = uploadResult.url;

  try {
    const updated = await User.updatePhoto(userId, newPhotoUrl);
    if (!updated) {
      throw new Error('Database update failed');
    }
  } catch (error) {
    const publicId = getPublicIdFromUrl(newPhotoUrl);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.error(
          'Failed to rollback uploaded profile photo from Cloudinary:',
          deleteError.message,
        );
      }
    }
    console.error('Failed to update user photo in database:', error.message);
    throw createHttpError(500, 'Не вдалося оновити фото профілю');
  }

  if (previousPhotoUrl && previousPhotoUrl.includes('cloudinary.com')) {
    const previousPublicId = getPublicIdFromUrl(previousPhotoUrl);
    if (previousPublicId) {
      try {
        await deleteFromCloudinary(previousPublicId);
      } catch (error) {
        console.error(
          'Failed to delete previous profile photo from Cloudinary:',
          error.message,
        );
      }
    }
  }

  const updatedUser = await User.findById(userId);

  return {
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    name: updatedUser.name,
    surname: updatedUser.surname,
    photo: updatedUser.photo,
    balance: updatedUser.balance,
    passportValid: updatedUser.passport_valid,
    isAdmin: updatedUser.is_admin,
    lastOnline: updatedUser.last_online,
    isOnline: updatedUser.is_online,
    banned: updatedUser.banned,
  };
};

export const logoutUser = async (accessToken) => {
  const session = await Session.findByAccessToken(accessToken);
  if (session) {
    await Session.deleteById(session.id);
    await User.setOffline(session.user_id);
  }
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createHttpError(404, 'Користувача не знайдено');
  }

  if (user.banned) {
    throw createHttpError(403, 'Ваш акаунт заблоковано');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    surname: user.surname,
    photo: user.photo,
    balance: user.balance,
    passportValid: user.passport_valid,
    isAdmin: user.is_admin,
    lastOnline: user.last_online,
    isOnline: user.is_online,
    banned: user.banned,
  };
};
