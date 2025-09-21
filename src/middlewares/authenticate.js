import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { env } from '../utils/env.js';

const JWT_SECRET = env('JWT_SECRET');

export const authenticate = async (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    return next(createHttpError(401, 'Authorization header обязателен'));
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    return next(
      createHttpError(401, 'Authorization header должен быть типа Bearer'),
    );
  }

  try {
    // Verify JWT token
    const payload = jwt.verify(token, JWT_SECRET);

    // Find session
    const session = await Session.findByAccessToken(token);
    if (!session) {
      return next(createHttpError(401, 'Сессия не найдена'));
    }

    // Check if access token is expired
    const isAccessTokenExpired =
      new Date() > new Date(session.access_token_valid_until);
    if (isAccessTokenExpired) {
      return next(createHttpError(401, 'Access token истек'));
    }

    // Find user
    const user = await User.findById(session.user_id);
    if (!user) {
      await Session.deleteById(session.id);
      return next(createHttpError(401, 'Пользователь не найден'));
    }

    // Check if user is banned
    if (user.banned) {
      await Session.deleteById(session.id);
      return next(createHttpError(403, 'Ваш аккаунт заблокирован'));
    }

    // Add user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      surname: user.surname,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createHttpError(401, 'Недействительный токен'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(createHttpError(401, 'Токен истек'));
    }
    next(error);
  }
};
