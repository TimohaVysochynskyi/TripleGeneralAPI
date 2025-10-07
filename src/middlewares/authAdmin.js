import createHttpError from 'http-errors';

export const authAdmin = (req, res, next) => {
  // Check if user is authenticated (set by authenticate middleware)
  if (!req.user) {
    return next(createHttpError(401, 'Необхідна аутентифікація'));
  }

  // Check if user has admin role
  if (!req.user.is_admin) {
    return next(
      createHttpError(403, 'Доступ заборонено: потрібні права адміністратора'),
    );
  }

  next();
};
