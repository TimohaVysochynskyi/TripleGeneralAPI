import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

import { Session } from '../models/auth/Session.js';
import { User } from '../models/auth/User.js';
import { env } from '../utils/env.js';

const JWT_SECRET = env('JWT_SECRET');

export const authenticate = async (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    return next(createHttpError(401, "Authorization header обов'язковий"));
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return next(
      createHttpError(401, 'Authorization header повинен бути типу Bearer'),
    );
  }

  try {
    // Verify JWT token
    const payload = jwt.verify(token, JWT_SECRET);

    // Find session
    const session = await Session.findByAccessToken(token);
    if (!session) {
      return next(createHttpError(401, 'Сесію не знайдено'));
    }

    // Check if access token is expired
    const isAccessTokenExpired =
      new Date() > new Date(session.access_token_valid_until);
    if (isAccessTokenExpired) {
      return next(createHttpError(401, 'Access token прострочений'));
    }

    // Find user
    const user = await User.findById(session.user_id);
    if (!user) {
      await Session.deleteById(session.id);
      return next(createHttpError(401, 'Користувача не знайдено'));
    }

    // Check if user is banned
    if (user.banned) {
      await Session.deleteById(session.id);
      return next(createHttpError(403, 'Ваш акаунт заблоковано'));
    }

    // Add user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      surname: user.surname,
      is_admin: user.is_admin, // 🆕 Додаємо is_admin
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createHttpError(401, 'Недійсний токен'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(createHttpError(401, 'Токен прострочений'));
    }
    next(error);
  }
};
