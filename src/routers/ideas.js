import { Router } from 'express';
import { postIdea } from '../controllers/ideas.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { validateBody } from '../middlewares/validateBody.js';
import { ideasValidation } from '../validation/ideasValidation.js';

const router = Router();

router.post('/', validateBody(ideasValidation), ctrlWrapper(postIdea));

export default router;
