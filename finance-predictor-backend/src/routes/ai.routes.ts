import { Router } from 'express';
import { analyzeFinances } from '../controllers/ai.controller.ts';
import { validate } from '../middleware/validate.ts';
import { analyzeBodySchema } from '../schemas/ai.schema.ts';

const router = Router();

router.post('/analyze', validate(analyzeBodySchema), analyzeFinances);

export default router;
