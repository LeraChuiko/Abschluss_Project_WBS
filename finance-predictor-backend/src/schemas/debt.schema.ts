import { z } from 'zod';

export const updateDebtSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    totalAmount: z.number().min(0).optional(),
    monthlyPayment: z.number().min(0).optional(),
    startMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    months: z.number().int().min(1).max(60).optional(),
  }),
});

export const createDebtSchema = z.object({
  body: z
    .object({
      title: z.string().min(1),
      totalAmount: z.number().positive(),
      monthlyPayment: z.number().positive(),
      startMonth: z.string().regex(/^\d{4}-\d{2}$/),
      months: z.number().int().min(1).max(60),
    })
    .superRefine((data, ctx) => {
      const product = Number((data.monthlyPayment * data.months).toFixed(2));
      const total = Number(data.totalAmount.toFixed(2));
      if (product !== total) {
        ctx.addIssue({
          code: 'custom',
          path: ['totalAmount'],
          message: `Gesamtsumme muss Rate × Monate sein: ${data.monthlyPayment} × ${data.months} = ${product} €`,
        });
      }
    }),
});