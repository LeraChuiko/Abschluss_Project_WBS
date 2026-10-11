import type { Request, Response, NextFunction } from 'express';
import { resolveImageUrl, unsplashPhotoId } from '../lib/imageUrl.ts';
import { SavingsGoal } from '../models/SavingsGoal.ts';
import { Transaction } from '../models/Transaction.ts';

const berlinToday = (): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

const berlinMonthNow = (): string => berlinToday().slice(0, 7);

const paidOf = async (goalId: unknown): Promise<number> => {
  const rows = await Transaction.find({ savingsGoalId: goalId, type: 'expense' });
  return Number(rows.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
};

const withPaid = async (doc: InstanceType<typeof SavingsGoal>) => {
  const currentAmount = await paidOf(doc._id);
  if (doc.imageUrl && unsplashPhotoId(doc.imageUrl) && !doc.imageUrl.includes('images.unsplash.com')) {
    doc.imageUrl = await resolveImageUrl(doc.imageUrl);
    await doc.save();
  }
  return { ...doc.toObject(), currentAmount };
};

export const createSavingsGoal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await SavingsGoal.create({
      title: req.body.title,
      targetAmount: req.body.targetAmount,
      imageUrl: await resolveImageUrl(req.body.imageUrl ?? ''),
      currentAmount: 0,
    });
    res.status(201).json({ ...doc.toObject(), currentAmount: 0 });
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
    const payload = await Promise.all(items.map((item) => withPaid(item)));
    res.status(200).json(payload);
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

    if (typeof req.body.title === 'string') {
      doc.title = req.body.title;
    }
    if (typeof req.body.targetAmount === 'number') {
      doc.targetAmount = req.body.targetAmount;
    }
    if (typeof req.body.imageUrl === 'string') {
      doc.imageUrl = await resolveImageUrl(req.body.imageUrl);
    }

    await doc.save();

    if (typeof req.body.title === 'string') {
      await Transaction.updateMany({ savingsGoalId: doc._id }, { title: doc.title });
    }

    res.status(200).json(await withPaid(doc));
  } catch (error) {
    next(error);
  }
};

export const depositSavingsGoal = async (
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

    const dateIso = typeof req.body.date === 'string' ? req.body.date : berlinToday();
    const month = dateIso.slice(0, 7);
    if (month < berlinMonthNow()) {
      res.status(409).json({ message: 'Vergangene Monate können nicht geändert werden' });
      return;
    }

    const amount = Number(Number(req.body.amount).toFixed(2));
    const paid = await paidOf(doc._id);
    const rest = Math.max(0, Number((doc.targetAmount - paid).toFixed(2)));
    if (amount > rest) {
      res.status(400).json({
        message: `Die Summe ist größer als der Rest. Rest: ${rest.toLocaleString('de-DE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} €`,
      });
      return;
    }

    await Transaction.create({
      type: 'expense',
      title: doc.title,
      amount,
      date: new Date(`${dateIso}T00:00:00.000Z`),
      expenseBlock: 'variable',
      importantDate: true,
      savingsGoalId: doc._id,
    });

    doc.currentAmount = Number((paid + amount).toFixed(2));
    await doc.save();
    res.status(200).json(await withPaid(doc));
  } catch (error) {
    next(error);
  }
};
