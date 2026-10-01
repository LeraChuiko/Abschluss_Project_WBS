import type { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction.ts';

const monthPattern = /^\d{4}-\d{2}$/;

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const month = req.query.month;

    if (typeof month !== 'string' || !monthPattern.test(month)) {
      res.status(400).json({
        message: 'Query month is required, format YYYY-MM',
      });
      return;
    }

    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const items = await Transaction.find({
      date: { $gte: start, $lt: end },
    });

    let incomeTotal = 0;
    let expenseTotal = 0;

    const expenseByBlock = { fixed: 0, periodic: 0, variable: 0 };
    const incomeByGroup = {
      salary: 0,
      business: 0,
      freelance: 0,
      gift: 0,
      investment: 0,
    };

    for (const item of items) {
      if (item.type === 'income') {
        incomeTotal += item.amount;
        if (item.incomeGroup && item.incomeGroup in incomeByGroup) {
          incomeByGroup[item.incomeGroup as keyof typeof incomeByGroup] += item.amount;
        }
      } else if (item.type === 'expense') {
        expenseTotal += item.amount;
        if (item.expenseBlock) {
          expenseByBlock[item.expenseBlock] += item.amount;
        }
      }
    }

    res.status(200).json({
      month,
      incomeTotal,
      expenseTotal,
      balance: incomeTotal - expenseTotal,
      expenseByBlock,
      incomeByGroup,
    });
  } catch (error) {
    next(error);
  }
};