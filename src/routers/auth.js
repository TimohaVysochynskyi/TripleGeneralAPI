import { Router } from 'express';

import { register, login, refresh, logout, me } from '../controllers/auth.js';
import { validateBody } from '../middlewares/validateBody.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authRateLimit, registerRateLimit } from '../middlewares/rateLimits.js';
import {
  registerValidation,
  loginValidation,
  refreshValidation,
} from '../validation/authValidation.js';

const authRouter = Router();

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

export default authRouter;
