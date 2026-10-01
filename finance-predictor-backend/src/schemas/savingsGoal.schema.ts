import { z } from 'zod';

export const createSavingsGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    targetAmount: z.number().positive(),
    currentAmount: z.number().min(0).optional(),
  }),
});

export const updateSavingsGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    targetAmount: z.number().positive().optional(),
    currentAmount: z.number().min(0).optional(),
    addPayment: z
      .object({
        month: z.string().regex(/^\d{4}-\d{2}$/),
        amount: z.number().positive(),
      })
      .optional(),
  }),
});