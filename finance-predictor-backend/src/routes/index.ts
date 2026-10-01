import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.ts';
import transactionRoutes from './transaction.routes.ts';
import dashboardRoutes from './dashboard.routes.ts';
import debtRoutes from './debt.routes.ts';
import savingsGoalRoutes from './savingsGoal.routes.ts';

const router = Router();

router.get('/health', getHealth);
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/debts', debtRoutes);
router.use('/savings-goals', savingsGoalRoutes);


export default router;
