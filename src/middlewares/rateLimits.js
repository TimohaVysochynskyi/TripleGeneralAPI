import rateLimit from 'express-rate-limit';

// Helper function to safely get client IP (IPv4/IPv6 compatible)
const getClientIp = (req) => {
  // Get IP from Express (already handles IPv6)
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

// Rate limit for login - per user (IP + email/nickname)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per 15 minutes per user
  message: {
    status: 429,
    message: 'Забагато спроб входу. Спробуйте через 15 хвилин.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // Generate unique key per user (IP + email/nickname)
  keyGenerator: (req) => {
    const identifier =
      req.body?.emailOrNickname ||
      req.body?.email ||
      req.body?.nickname ||
      'unknown';
    const ip = getClientIp(req);
    return `auth:${ip}:${identifier.toLowerCase()}`;
  },
});

// Strict rate limit for registration - per IP (to prevent spam)
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 registrations per hour per IP
  message: {
    status: 429,
    message: 'Забагато реєстрацій. Спробуйте через годину.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // For registration, we keep IP-based limiting to prevent spam
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    return `register:${ip}`;
  },
});

// General API rate limit - per IP
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes per IP
  message: {
    status: 429,
    message: 'Забагато запитів. Спробуйте пізніше.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    return `api:${ip}`;
  },
});

// Rate limit for file uploads - stricter to prevent abuse
export const fileUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 file uploads per hour per user
  message: {
    status: 429,
    message: 'Забагато завантажень файлів. Спробуйте через годину.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    const ip = getClientIp(req);
    return `upload:${ip}:${userId}`;
  },
});
