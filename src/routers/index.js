import { Router } from 'express';
import ideasRouter from './ideas.js';
import authRouter from './auth.js';

const router = Router();

router.use('/ideas', ideasRouter);
router.use('/auth', authRouter);

export default router;
