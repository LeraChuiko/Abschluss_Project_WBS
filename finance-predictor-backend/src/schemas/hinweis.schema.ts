import { z } from 'zod';

const month = z.string().regex(/^\d{4}-\d{2}$/);

export const createHinweisSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(80),
    note: z.string().max(200).optional(),
    month,
    endMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    everyMonths: z.number().int().min(0).max(12).optional(),
    customMonths: z.array(z.number().int().min(1).max(12)).optional(),
  }),
});

export const updateHinweisSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(80).optional(),
    note: z.string().max(200).optional(),
    month: month.optional(),
    endMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    everyMonths: z.number().int().min(0).max(12).optional(),
    customMonths: z.array(z.number().int().min(1).max(12)).optional(),
    doneMonths: z.array(z.string().regex(/^\d{4}-\d{2}$/)).optional(),
    done: z.boolean().optional(),
  }),
});
