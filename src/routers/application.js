import { Router } from 'express';
import multer from 'multer';

import {
  submit,
  getMy,
  getById,
  getAll,
  updateStatus,
  deleteApp,
} from '../controllers/application.js';
import { validateBody } from '../middlewares/validateBody.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authAdmin } from '../middlewares/authAdmin.js';
import { isValidId } from '../middlewares/isValidId.js';
import { fileUploadRateLimit } from '../middlewares/rateLimits.js';
import {
  validateApplicationData,
  updateApplicationStatusValidation,
} from '../validation/applicationValidation.js';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 3, // max 3 files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Підтримуються лише JPEG та PNG файли'), false);
    }
  },
});

const applicationRouter = Router();

// User routes - require authentication
applicationRouter.post(
  '/submit',
  authenticate,
  fileUploadRateLimit, // Add rate limit for file uploads
  upload.fields([
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'userPhoto', maxCount: 1 },
    { name: 'digitalSignature', maxCount: 1 }, // optional file
  ]),
  validateApplicationData,
  submit,
);

applicationRouter.get('/my', authenticate, getMy);

// Admin routes - require admin authentication
applicationRouter.get('/all', authenticate, authAdmin, getAll);

applicationRouter.get('/:id', authenticate, authAdmin, isValidId, getById);

applicationRouter.patch(
  '/:id/status',
  authenticate,
  authAdmin,
  isValidId,
  validateBody(updateApplicationStatusValidation),
  updateStatus,
);

// Delete application route - admin only
applicationRouter.delete('/:id', authenticate, authAdmin, isValidId, deleteApp);

export default applicationRouter;
