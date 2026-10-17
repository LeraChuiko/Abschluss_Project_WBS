import type { Request, Response, NextFunction } from 'express';
import { Debt } from '../models/Debt.ts';
import { ensureRecurringForRange } from '../lib/ensureRecurring.ts';
import { SavingsGoal } from '../models/SavingsGoal.ts';
import { Transaction } from '../models/Transaction.ts';

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const date =
      typeof req.body.date === 'string'
        ? new Date(`${req.body.date}T00:00:00.000Z`)
        : req.body.date;
    const seriesId =
      typeof req.body.seriesId === 'string' && req.body.seriesId
        ? req.body.seriesId
        : undefined;
    const doc = await Transaction.create({ ...req.body, date, ...(seriesId ? { seriesId } : {}) });
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
    const year = req.query.year;
    const filter: Record<string, unknown> = {};

    if (typeof year === 'string' && /^\d{4}$/.test(year)) {
      await ensureRecurringForRange(`${year}-01`, `${year}-12`);
      filter.date = {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lt: new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`),
      };
    } else if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      await ensureRecurringForRange(month, month);
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

const monthUtc = (date: Date): string => date.toISOString().slice(0, 7);

const spreadDebtLeftover = async (debtId: unknown, fromMonth: string): Promise<void> => {
  const debt = await Debt.findById(debtId);
  if (!debt) {
    return;
  }
  const related = await Transaction.find({ debtId } as never).sort({ date: 1 }).lean();
  const paidSoFar = related
    .filter((item) => monthUtc(item.date) <= fromMonth)
    .reduce((sum, item) => sum + item.amount, 0);
  let leftover = Math.max(0, Number((debt.totalAmount - paidSoFar).toFixed(2)));
  const later = related.filter((item) => monthUtc(item.date) > fromMonth);
  const rate = debt.monthlyPayment > 0 ? debt.monthlyPayment : leftover;
  for (let i = 0; i < later.length; i += 1) {
    const row = later[i];
    if (!row) {
      continue;
    }
    const isLast = i === later.length - 1;
    const next = leftover <= 0 ? 0 : isLast ? leftover : Math.min(rate, leftover);
    const amount = Number(next.toFixed(2));
    leftover = Math.max(0, Number((leftover - amount).toFixed(2)));
    await Transaction.updateOne({ _id: row._id }, { $set: { amount } });
  }
};

const berlinMonthNow = (): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
};

export const updateTransaction = async (
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

    const docMonth = monthUtc(doc.date);
    if (docMonth < berlinMonthNow()) {
      res.status(409).json({ message: 'Vergangene Monate können nicht geändert werden' });
      return;
    }

    if (typeof req.body.amount === 'number' && doc.debtId) {
      const debt = await Debt.findById(doc.debtId);
      if (debt) {
        const related = await Transaction.find({ debtId: doc.debtId });
        const paidBefore = related
          .filter((item) => monthUtc(item.date) < docMonth)
          .reduce((sum, item) => sum + item.amount, 0);
        const rest = Math.max(0, Number((debt.totalAmount - paidBefore).toFixed(2)));
        if (req.body.amount > rest) {
          res.status(400).json({
            message: `Die Summe ist größer als der Rest. Rest: ${rest.toLocaleString('de-DE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} €`,
          });
          return;
        }
      }
    }

    if (typeof req.body.amount === 'number' && doc.savingsGoalId) {
      const goal = await SavingsGoal.findById(doc.savingsGoalId);
      if (goal) {
        const related = await Transaction.find({ savingsGoalId: doc.savingsGoalId });
        const paidOthers = related
          .filter((item) => String(item._id) !== String(doc._id))
          .reduce((sum, item) => sum + item.amount, 0);
        const credited = Number((goal.creditedAmount ?? 0).toFixed(2));
        const rest = Math.max(0, Number((goal.targetAmount - paidOthers - credited).toFixed(2)));
        if (req.body.amount > rest) {
          res.status(400).json({
            message: `Die Summe ist größer als der Rest. Rest: ${rest.toLocaleString('de-DE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} €`,
          });
          return;
        }
      }
    }

    if (typeof req.body.title === 'string') {
      doc.title = req.body.title;
    }
    if (typeof req.body.amount === 'number') {
      doc.amount = req.body.amount;
    }
    if (typeof req.body.date === 'string') {
      doc.date = new Date(`${req.body.date}T00:00:00.000Z`);
    }
    if (typeof req.body.importantDate === 'boolean') {
      doc.importantDate = req.body.importantDate;
    }
    await doc.save();

    const from = new Date(`${docMonth}-01T00:00:00.000Z`);
    const zeroing = typeof req.body.amount === 'number' && req.body.amount === 0;

    if (doc.seriesId) {
      const seriesPatch: Record<string, unknown> = {};
      if (typeof req.body.amount === 'number') {
        seriesPatch.amount = req.body.amount;
      }
      if (typeof req.body.title === 'string') {
        seriesPatch.title = req.body.title;
      }
      if (Object.keys(seriesPatch).length > 0) {
        if (doc.type === 'income') {
          await Transaction.updateMany(
            {
              type: 'income',
              seriesId: doc.seriesId,
              date: { $gte: from },
            },
            seriesPatch,
          );
        } else if (doc.type === 'expense' && !doc.debtId && !doc.savingsGoalId) {
          await Transaction.updateMany(
            {
              type: 'expense',
              seriesId: doc.seriesId,
              date: { $gte: from },
            },
            seriesPatch,
          );
        }
      }
    }

    if (zeroing && doc.type === 'income') {
      await Transaction.updateMany(
        {
          type: 'income',
          title: doc.title,
          incomeGroup: doc.incomeGroup,
          date: { $gte: from },
        },
        { amount: 0 },
      );
    }

    if (
      typeof req.body.amount === 'number' &&
      doc.type === 'expense' &&
      !doc.debtId &&
      !doc.savingsGoalId
    ) {
      const linked = doc.seriesId
        ? await Transaction.countDocuments({ seriesId: doc.seriesId })
        : 0;
      if (linked <= 1 || zeroing) {
        await Transaction.updateMany(
          {
            type: 'expense',
            expenseBlock: doc.expenseBlock,
            title: doc.title,
            date: { $gte: from },
            debtId: { $exists: false },
            savingsGoalId: { $exists: false },
          },
          { amount: req.body.amount },
        );
      }
    }

    if (typeof req.body.amount === 'number' && doc.debtId) {
      await spreadDebtLeftover(doc.debtId, docMonth);
    }

    res.status(200).json(doc);
  } catch (error) {
    next(error);
  }
};
