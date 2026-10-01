import { z } from 'zod';

export const createDebtSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    totalAmount: z.number().positive(),
    monthlyPayment: z.number().positive(),
    startMonth: z.string().regex(/^\d{4}-\d{2}$/),
    months: z.number().int().min(1).max(60),
  }),
});