import { z } from 'zod';

export const createSavingsGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    targetAmount: z.number().positive(),
    imageUrl: z.string().trim().max(2000).optional(),
  }),
});

export const updateSavingsGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    targetAmount: z.number().min(0).optional(),
    imageUrl: z.string().trim().max(2000).optional(),
  }),
});

export const depositSavingsGoalSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});