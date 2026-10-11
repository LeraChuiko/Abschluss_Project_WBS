import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.ts';
import { requireAuth } from '../middleware/requireAuth.ts';
import authRoutes from './auth.routes.ts';
import transactionRoutes from './transaction.routes.ts';
import dashboardRoutes from './dashboard.routes.ts';
import debtRoutes from './debt.routes.ts';
import savingsGoalRoutes from './savingsGoal.routes.ts';

const router = Router();

router.get('/health', getHealth);
router.use('/auth', authRoutes);
router.use('/transactions', requireAuth, transactionRoutes);
router.use('/dashboard', requireAuth, dashboardRoutes);
router.use('/debts', requireAuth, debtRoutes);
router.use('/savings-goals', requireAuth, savingsGoalRoutes);


export default router;
