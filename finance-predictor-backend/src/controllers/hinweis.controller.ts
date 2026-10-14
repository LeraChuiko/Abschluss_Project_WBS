import type { Request, Response, NextFunction } from 'express';
import { Hinweis } from '../models/Hinweis.ts';

export const createHinweis = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await Hinweis.create({
      title: req.body.title,
      note: req.body.note ?? '',
      month: req.body.month,
      endMonth: req.body.endMonth ?? '',
      everyMonths: req.body.everyMonths ?? 0,
      customMonths: req.body.customMonths ?? [],
      doneMonths: [],
    });
    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
};

export const listHinweise = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const items = await Hinweis.find().sort({ month: 1, createdAt: 1 });
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

export const updateHinweis = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await Hinweis.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ message: 'Hinweis not found' });
      return;
    }
    if (typeof req.body.title === 'string') {
      doc.title = req.body.title;
    }
    if (typeof req.body.note === 'string') {
      doc.note = req.body.note;
    }
    if (typeof req.body.month === 'string') {
      doc.month = req.body.month;
    }
    if (typeof req.body.done === 'boolean') {
      doc.done = req.body.done;
    }
    if (typeof req.body.everyMonths === 'number') {
      doc.everyMonths = req.body.everyMonths;
    }
    if (typeof req.body.endMonth === 'string') {
      doc.endMonth = req.body.endMonth;
    }
    if (Array.isArray(req.body.customMonths)) {
      doc.customMonths = req.body.customMonths;
    }
    if (Array.isArray(req.body.doneMonths)) {
      doc.doneMonths = req.body.doneMonths;
    }
    await doc.save();
    res.status(200).json(doc);
  } catch (error) {
    next(error);
  }
};

export const deleteHinweis = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const doc = await Hinweis.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404).json({ message: 'Hinweis not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
