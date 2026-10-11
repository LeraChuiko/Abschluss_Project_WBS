import { Router } from 'express';
import { validate } from '../middleware/validate.ts';
import {
  createSavingsGoalSchema,
  depositSavingsGoalSchema,
  updateSavingsGoalSchema,
} from '../schemas/savingsGoal.schema.ts';
import {
  createSavingsGoal,
  depositSavingsGoal,
  listSavingsGoals,
  updateSavingsGoal,
} from '../controllers/savingsGoal.controller.ts';

const router = Router();

router.get('/', listSavingsGoals);
router.post('/', validate(createSavingsGoalSchema), createSavingsGoal);
router.post('/:id/deposit', validate(depositSavingsGoalSchema), depositSavingsGoal);
router.patch('/:id', validate(updateSavingsGoalSchema), updateSavingsGoal);

export default router;
