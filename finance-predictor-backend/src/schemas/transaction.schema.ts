import { z } from 'zod';

const incomeGroup = z.enum(['salary', 'business', 'freelance', 'gift', 'investment']);
const expenseBlock = z.enum(['fixed', 'periodic', 'variable']);

export const updateTransactionSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    amount: z.number().min(0).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    incomeGroup: incomeGroup.optional(),
    expenseBlock: expenseBlock.optional(),
    importantDate: z.boolean().optional(),
  }),
});

export const createTransactionSchema = z.object({
  body: z
    .object({
      type: z.enum(['income', 'expense']),
      title: z.string().min(1),
      amount: z.number().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      incomeGroup: incomeGroup.optional(),
      expenseBlock: expenseBlock.optional(),
      importantDate: z.boolean().optional(),
      seriesId: z.string().min(1).optional(),
      savingsGoalId: z.string().min(1).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === 'income' && !data.incomeGroup) {
        ctx.addIssue({
          code: 'custom',
          message: 'incomeGroup is required for income',
          path: ['incomeGroup'],
        });
      }
      if (data.type === 'expense' && !data.expenseBlock) {
        ctx.addIssue({
          code: 'custom',
          message: 'expenseBlock is required for expense',
          path: ['expenseBlock'],
        });
      }
    }),
});