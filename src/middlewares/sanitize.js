import validator from 'validator';

export const sanitizeInput = (req, res, next) => {
  // Sanitize all string fields in body except password fields
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Don't sanitize password fields as they should contain special characters
        if (!key.toLowerCase().includes('password')) {
          // Escape HTML to prevent XSS
          req.body[key] = validator.escape(req.body[key].trim());
        } else {
          // Just trim password fields
          req.body[key] = req.body[key].trim();
        }
      }
    }
  }

  next();
};

// Middleware to prevent NoSQL injection (даже для MySQL полезно)
export const preventInjection = (req, res, next) => {
  if (req.body) {
    // Remove any objects that could be injection attempts
    for (const key in req.body) {
      if (typeof req.body[key] === 'object' && req.body[key] !== null) {
        return res.status(400).json({
          status: 400,
          message: 'Invalid input format detected',
        });
      }
    }
  }

  next();
};
