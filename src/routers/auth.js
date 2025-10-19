import { Router } from 'express';
import multer from 'multer';
import createHttpError from 'http-errors';

import { register, login, refresh, logout, me, updatePhoto } from '../controllers/auth.js';
import { validateBody } from '../middlewares/validateBody.js';
import { authenticate } from '../middlewares/authenticate.js';
import {
  authRateLimit,
  registerRateLimit,
  fileUploadRateLimit,
} from '../middlewares/rateLimits.js';
import {
  registerValidation,
  loginValidation,
  refreshValidation,
} from '../validation/authValidation.js';

const authRouter = Router();

const profilePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(createHttpError(400, 'Підтримуються лише JPEG та PNG файли'));
  },
});

authRouter.post(
  '/register',
  registerRateLimit,
  validateBody(registerValidation),
  register,
);
authRouter.post('/login', authRateLimit, validateBody(loginValidation), login);
authRouter.post(
  '/refresh',
  authRateLimit,
  validateBody(refreshValidation),
  refresh,
);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
authRouter.patch(
  '/profile/photo',
  authenticate,
  fileUploadRateLimit,
  profilePhotoUpload.single('photo'),
  updatePhoto,
);

export default authRouter;
