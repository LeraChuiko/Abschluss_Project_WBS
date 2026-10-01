// CRUD + transfer + spend for savings goals.
import type { Request, Response, NextFunction } from 'express';
import { SavingsGoal } from '../models/SavingsGoal.ts';

export const createSavingsGoal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await SavingsGoal.create(req.body);
    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
};

export const listSavingsGoals = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const items = await SavingsGoal.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

export const updateSavingsGoal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await SavingsGoal.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ message: 'Savings goal not found' });
      return;
    }

    if (req.body.addPayment) {
      if (doc.payments.length === 0 && doc.currentAmount > 0) {
        doc.payments.push({ month: '2026-01', amount: doc.currentAmount });
      }
      doc.payments.push({
        month: req.body.addPayment.month,
        amount: req.body.addPayment.amount,
      });
      doc.currentAmount = doc.payments.reduce((sum, p) => sum + p.amount, 0);
    }

    if (typeof req.body.title === 'string') {
      doc.title = req.body.title;
    }
    if (typeof req.body.targetAmount === 'number') {
      doc.targetAmount = req.body.targetAmount;
    }
    if (typeof req.body.currentAmount === 'number' && !req.body.addPayment) {
      doc.currentAmount = req.body.currentAmount;
    }

    await doc.save();
    res.status(200).json(doc);
  } catch (error) {
    next(error);
  }
};