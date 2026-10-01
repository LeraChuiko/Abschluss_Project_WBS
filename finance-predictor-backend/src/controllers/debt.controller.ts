// CRUD functions for debts. Remaining amount is changed via update, not a cron job.
import type { Request, Response, NextFunction } from 'express';
import { Debt } from '../models/Debt.ts';
import { Transaction } from '../models/Transaction.ts';

export const createDebt = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, totalAmount, monthlyPayment, startMonth, months } = req.body;

    const debt = await Debt.create({
      title,
      totalAmount,
      monthlyPayment,
      startMonth,
      months,
    });

    const start = new Date(`${startMonth}-01T00:00:00.000Z`);
    const expenses = [];

    for (let i = 0; i < months; i += 1) {
      const date = new Date(start);
      date.setUTCMonth(date.getUTCMonth() + i);
      expenses.push({
        type: 'expense',
        title,
        amount: monthlyPayment,
        date,
        expenseBlock: 'periodic',
        debtId: debt._id,
      });
    }

    await Transaction.insertMany(expenses);

    res.status(201).json(debt);
  } catch (error) {
    next(error);
  }
};

export const listDebts = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const items = await Debt.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};