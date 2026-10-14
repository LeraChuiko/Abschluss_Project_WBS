import { Router } from 'express';
import { validate } from '../middleware/validate.ts';
import { createHinweisSchema, updateHinweisSchema } from '../schemas/hinweis.schema.ts';
import {
  createHinweis,
  deleteHinweis,
  listHinweise,
  updateHinweis,
} from '../controllers/hinweis.controller.ts';

const router = Router();

router.get('/', listHinweise);
router.post('/', validate(createHinweisSchema), createHinweis);
router.patch('/:id', validate(updateHinweisSchema), updateHinweis);
router.delete('/:id', deleteHinweis);

export default router;
