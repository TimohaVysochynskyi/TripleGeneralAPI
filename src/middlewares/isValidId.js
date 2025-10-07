import createHttpError from 'http-errors';

export const isValidId = (req, res, next) => {
  const { id } = req.params;

  // Check if id is a valid integer (for MySQL auto-increment IDs)
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId) || parsedId <= 0 || !Number.isInteger(parsedId)) {
    return next(createHttpError(400, 'Невірний формат ID'));
  }

  // Add parsed ID to req.params for convenience
  req.params.id = parsedId;

  next();
};
