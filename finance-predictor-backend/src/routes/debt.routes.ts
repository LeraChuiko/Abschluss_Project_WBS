import { Router } from 'express';
import { validate } from '../middleware/validate.ts';
import { createDebtSchema, updateDebtSchema } from '../schemas/debt.schema.ts';
import { createDebt, deleteDebt, listDebts, updateDebt } from '../controllers/debt.controller.ts';

const router = Router();

router.get('/', listDebts);
router.post('/', validate(createDebtSchema), createDebt);
router.patch('/:id', validate(updateDebtSchema), updateDebt);
router.delete('/:id', deleteDebt);

export default router;