import { z } from 'zod';

export const analyzeBodySchema = z.object({
  body: z.object({
    useDemoData: z.boolean().optional(),
  }),
});

export const aiForecastSchema = z.object({
  projectedYearEndFreeFunds: z.number(),
  summary: z.string().min(1),
  riskLevel: z.enum(['low', 'medium', 'high']),
  riskExplanation: z.string().min(1),
  recommendations: z.array(z.string().min(1)).length(3),
});

export type AiForecast = z.infer<typeof aiForecastSchema>;
