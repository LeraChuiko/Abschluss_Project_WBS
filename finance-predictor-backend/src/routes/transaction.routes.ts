import { Router } from 'express';
import { validate } from '../middleware/validate.ts';
import { createTransactionSchema, updateTransactionSchema } from '../schemas/transaction.schema.ts';
import {
  createTransaction,
  listTransactions,
  updateTransaction,
} from '../controllers/transaction.controller.ts';

const router = Router();

router.get('/', listTransactions);
router.post('/', validate(createTransactionSchema), createTransaction);
router.patch('/:id', validate(updateTransactionSchema), updateTransaction);
export default router;