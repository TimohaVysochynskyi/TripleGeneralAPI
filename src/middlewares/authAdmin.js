import createHttpError from 'http-errors';
import { env } from '../utils/env.js';

export const authAdmin = (req, res, next) => {
  const adminPassword = env('ADMIN_PASSWORD');
  const providedPassword = req.headers['x-admin-password'];

  if (!providedPassword || providedPassword !== adminPassword) {
    return next(
      createHttpError(403, 'Access denied: Admin privileges required.'),
    );
  }

  next();
};
