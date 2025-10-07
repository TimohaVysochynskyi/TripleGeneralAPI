import { Router } from 'express';

import {
  getById,
  getAll,
  updateStatus,
  deleteApp,
} from '../controllers/application.js';
import { validateBody } from '../middlewares/validateBody.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authAdmin } from '../middlewares/authAdmin.js';
import { isValidId } from '../middlewares/isValidId.js';
import { updateApplicationStatusValidation } from '../validation/applicationValidation.js';

const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticate);
adminRouter.use(authAdmin);

// GET /api/admin/applications - Get all applications with pagination
adminRouter.get('/applications', getAll);

// GET /api/admin/applications/:id - Get specific application
adminRouter.get('/applications/:id', isValidId, getById);

// PATCH /api/admin/applications/:id/status - Update application status
adminRouter.patch(
  '/applications/:id/status',
  isValidId,
  validateBody(updateApplicationStatusValidation),
  updateStatus,
);

// DELETE /api/admin/applications/:id - Delete application
adminRouter.delete('/applications/:id', isValidId, deleteApp);

export default adminRouter;
