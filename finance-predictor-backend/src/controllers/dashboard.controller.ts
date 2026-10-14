import type { Request, Response, NextFunction } from 'express';
import { ensureRecurringForRange } from '../lib/ensureRecurring.ts';
import { Transaction } from '../models/Transaction.ts';

const monthPattern = /^\d{4}-\d{2}$/;
const yearPattern = /^\d{4}$/;

type Totals = {
  month: string;
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  expenseByBlock: { fixed: number; periodic: number; variable: number };
  incomeByGroup: {
    salary: number;
    business: number;
    freelance: number;
    gift: number;
    investment: number;
  };
};

const emptyTotals = (month: string): Totals => ({
  month,
  incomeTotal: 0,
  expenseTotal: 0,
  balance: 0,
  expenseByBlock: { fixed: 0, periodic: 0, variable: 0 },
  incomeByGroup: {
    salary: 0,
    business: 0,
    freelance: 0,
    gift: 0,
    investment: 0,
  },
});

const addItem = (
  totals: Totals,
  item: { type: string; amount: number; incomeGroup?: string | null; expenseBlock?: string | null },
) => {
  if (item.type === 'income') {
    totals.incomeTotal += item.amount;
    if (item.incomeGroup && item.incomeGroup in totals.incomeByGroup) {
      totals.incomeByGroup[item.incomeGroup as keyof Totals['incomeByGroup']] += item.amount;
    }
  } else if (item.type === 'expense') {
    totals.expenseTotal += item.amount;
    if (item.expenseBlock && item.expenseBlock in totals.expenseByBlock) {
      totals.expenseByBlock[item.expenseBlock as keyof Totals['expenseByBlock']] += item.amount;
    }
  }
  totals.balance = totals.incomeTotal - totals.expenseTotal;
};

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const year = req.query.year;
    const month = req.query.month;

    if (typeof year === 'string' && yearPattern.test(year)) {
      const from = `${year}-01`;
      const to = `${year}-12`;
      await ensureRecurringForRange(from, to);
      const start = new Date(`${from}-01T00:00:00.000Z`);
      const end = new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`);
      const items = await Transaction.find({ date: { $gte: start, $lt: end } }).lean();
      const byMonth = new Map<string, Totals>();
      for (let m = 1; m <= 12; m += 1) {
        const key = `${year}-${String(m).padStart(2, '0')}`;
        byMonth.set(key, emptyTotals(key));
      }
      for (const item of items) {
        const key = item.date.toISOString().slice(0, 7);
        const totals = byMonth.get(key);
        if (totals) {
          addItem(totals, item);
        }
      }
      res.status(200).json({ year, months: [...byMonth.values()] });
      return;
    }

    if (typeof month !== 'string' || !monthPattern.test(month)) {
      res.status(400).json({
        message: 'Query month (YYYY-MM) or year (YYYY) is required',
      });
      return;
    }

    await ensureRecurringForRange(month, month);
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    const totals = emptyTotals(month);
    const items = await Transaction.find({ date: { $gte: start, $lt: end } }).lean();
    for (const item of items) {
      addItem(totals, item);
    }
    res.status(200).json(totals);
  } catch (error) {
    next(error);
  }
};
