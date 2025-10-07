import { Router } from 'express';
import ideasRouter from './ideas.js';
import authRouter from './auth.js';
import applicationRouter from './application.js';
import adminRouter from './admin.js';

const router = Router();

router.use('/ideas', ideasRouter);
router.use('/auth', authRouter);
router.use('/applications', applicationRouter);
router.use('/admin', adminRouter);

export default router;
