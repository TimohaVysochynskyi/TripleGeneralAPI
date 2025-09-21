import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

import { User } from '../models/auth/User.js';
import { Session } from '../models/auth/Session.js';
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
    throw createHttpError(409, 'Пользователь с таким email уже существует');
  }

  const existingUserByNickname = await User.findByUsername(nickname);
  if (existingUserByNickname) {
    throw createHttpError(409, 'Пользователь с таким никнеймом уже существует');
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
    throw createHttpError(401, 'Неверный логин или пароль');
  }

  // Check if user is banned
  if (user.banned) {
    throw createHttpError(403, 'Ваш аккаунт заблокирован');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createHttpError(401, 'Неверный логин или пароль');
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
    },
    ...tokens,
  };
};

export const refreshUserTokens = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, JWT_SECRET);
  } catch (error) {
    throw createHttpError(401, 'Refresh token недействителен');
  }

  const session = await Session.findByRefreshToken(refreshToken);
  if (!session) {
    throw createHttpError(401, 'Сессия не найдена');
  }

  const isRefreshTokenExpired =
    new Date() > new Date(session.refresh_token_valid_until);
  if (isRefreshTokenExpired) {
    await Session.deleteById(session.id);
    throw createHttpError(401, 'Refresh token истек');
  }

  const user = await User.findById(session.user_id);
  if (!user) {
    await Session.deleteById(session.id);
    throw createHttpError(401, 'Пользователь не найден');
  }

  if (user.banned) {
    await Session.deleteById(session.id);
    throw createHttpError(403, 'Ваш аккаунт заблокирован');
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
    },
    ...newTokens,
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
    throw createHttpError(404, 'Пользователь не найден');
  }

  if (user.banned) {
    throw createHttpError(403, 'Ваш аккаунт заблокирован');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    surname: user.surname,
    balance: user.balance,
    lastOnline: user.last_online,
    isOnline: user.is_online,
  };
};
