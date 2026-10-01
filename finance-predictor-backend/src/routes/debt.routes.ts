import { Router } from 'express';
import { validate } from '../middleware/validate.ts';
import { createDebtSchema } from '../schemas/debt.schema.ts';
import { createDebt, listDebts } from '../controllers/debt.controller.ts';

const router = Router();

router.get('/', listDebts);
router.post('/', validate(createDebtSchema), createDebt);

export default router;