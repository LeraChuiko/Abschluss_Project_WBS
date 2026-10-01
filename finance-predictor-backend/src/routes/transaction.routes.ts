import { Router } from 'express';
import { validate } from '../middleware/validate.ts';
import { createTransactionSchema } from '../schemas/transaction.schema.ts';
import {
  createTransaction,
  listTransactions,deleteTransaction
} from '../controllers/transaction.controller.ts';

const router = Router();

router.get('/', listTransactions);
router.post('/', validate(createTransactionSchema), createTransaction);
router.delete('/:id', deleteTransaction);
export default router;