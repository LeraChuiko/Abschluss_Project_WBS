import type { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction.ts';

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await Transaction.create(req.body);
    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
};

export const listTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const month = req.query.month;
    const filter: Record<string, unknown> = {};

    if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      filter.date = { $gte: start, $lt: end };
    }

    const items = await Transaction.find(filter).sort({ date: -1 });
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await Transaction.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }
    if (doc.expenseBlock === 'periodic' || doc.debtId) {
      res.status(409).json({ message: 'Raten können nicht einzeln gelöscht werden' });
      return;
    }
    if (doc.expenseBlock === 'fixed') {
      res.status(409).json({ message: 'Pflichtausgaben können nicht gelöscht werden' });
      return;
    }
    await doc.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};