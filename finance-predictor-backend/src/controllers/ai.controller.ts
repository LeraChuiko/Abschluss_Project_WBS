import { GoogleGenAI, Type } from '@google/genai';
import type { Request, Response, NextFunction } from 'express';
import { berlinCalendar, demoSnapshot, type BudgetSnapshot } from '../lib/aiBudget.ts';
import { byOwner, ownerId } from '../lib/owner.ts';
import { Debt } from '../models/Debt.ts';
import { Hinweis } from '../models/Hinweis.ts';
import { SavingsGoal } from '../models/SavingsGoal.ts';
import { Transaction } from '../models/Transaction.ts';
import { aiForecastSchema } from '../schemas/ai.schema.ts';

const forecastSchema = {
  type: Type.OBJECT,
  properties: {
    projectedYearEndFreeFunds: {
      type: Type.NUMBER,
      description: 'Realistische freie Mittel in Euro bis Jahresende',
    },
    summary: {
      type: Type.STRING,
      description: 'Kurze Begründung des Prognosewerts auf Deutsch, 2–3 Sätze',
    },
    riskLevel: {
      type: Type.STRING,
      enum: ['low', 'medium', 'high'],
      description: 'Risiko, dass die freien Mittel bis Jahresende nicht reichen',
    },
    riskExplanation: {
      type: Type.STRING,
      description: 'Kurze Risikoerklärung auf Deutsch, 1–2 Sätze',
    },
    recommendations: {
      type: Type.ARRAY,
      minItems: 3,
      maxItems: 3,
      items: { type: Type.STRING },
      description: 'Genau drei konkrete Tipps auf Deutsch',
    },
  },
  required: [
    'projectedYearEndFreeFunds',
    'summary',
    'riskLevel',
    'riskExplanation',
    'recommendations',
  ],
};

const monthUtc = (date: Date): string => date.toISOString().slice(0, 7);

const sumBy = (
  rows: Array<{ amount: number; key?: string | null }>,
): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const key = row.key || 'sonstige';
    out[key] = (out[key] ?? 0) + row.amount;
  }
  return out;
};

const remainingDebtMonthsInYear = (
  startMonth: string,
  months: number,
  year: string,
  currentMonth: string,
): number => {
  let count = 0;
  for (let i = 0; i < months; i += 1) {
    const y = Number(startMonth.slice(0, 4));
    const m = Number(startMonth.slice(5, 7));
    const date = new Date(Date.UTC(y, m - 1 + i, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    if (key.startsWith(year) && key >= currentMonth) {
      count += 1;
    }
  }
  return count;
};

const snapshotFromUser = async (userId: string): Promise<BudgetSnapshot> => {
  const cal = berlinCalendar();
  const yearStart = new Date(`${cal.year}-01-01T00:00:00.000Z`);
  const yearEnd = new Date(`${Number(cal.year) + 1}-01-01T00:00:00.000Z`);
  const owner = byOwner(userId);

  const [transactions, debts, goals, hints] = await Promise.all([
    Transaction.find({
      ...owner,
      date: { $gte: yearStart, $lt: yearEnd },
    }).lean(),
    Debt.find(owner).lean(),
    SavingsGoal.find(owner).lean(),
    Hinweis.find(owner).lean(),
  ]);

  const incomes = transactions.filter((item) => item.type === 'income' && item.amount > 0);
  const expenses = transactions.filter((item) => item.type === 'expense' && item.amount > 0);
  const incomeTotal = incomes.reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);

  const currentMonthRows = transactions.filter((item) => monthUtc(item.date) === cal.month);
  const typicalIncome = currentMonthRows
    .filter(
      (item) =>
        item.type === 'income' &&
        item.amount > 0 &&
        (item.incomeGroup === 'salary' ||
          item.incomeGroup === 'business' ||
          item.incomeGroup === 'investment'),
    )
    .reduce((sum, item) => sum + item.amount, 0);
  const typicalPflicht = currentMonthRows
    .filter((item) => item.type === 'expense' && item.expenseBlock === 'fixed' && item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const typicalRaten = currentMonthRows
    .filter((item) => item.type === 'expense' && item.expenseBlock === 'periodic' && item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const typicalVariable = currentMonthRows
    .filter((item) => item.type === 'expense' && item.expenseBlock === 'variable' && item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);

  const remainingMonthsIncludingCurrent = 13 - cal.monthNum;
  const remainingFullMonthsAfterCurrent = Math.max(0, 12 - cal.monthNum);

  return {
    today: cal.today,
    year: cal.year,
    currentMonth: cal.month,
    remainingMonthsIncludingCurrent,
    remainingFullMonthsAfterCurrent,
    yearToDate: {
      incomeTotal: Number(incomeTotal.toFixed(2)),
      expenseTotal: Number(expenseTotal.toFixed(2)),
      rest: Number((incomeTotal - expenseTotal).toFixed(2)),
      incomeByGroup: sumBy(incomes.map((item) => ({ amount: item.amount, key: item.incomeGroup }))),
      expenseByBlock: sumBy(
        expenses.map((item) => ({ amount: item.amount, key: item.expenseBlock })),
      ),
    },
    typicalMonth: {
      stableIncome: Number(typicalIncome.toFixed(2)),
      Pflicht: Number(typicalPflicht.toFixed(2)),
      raten: Number(typicalRaten.toFixed(2)),
      variable: Number(typicalVariable.toFixed(2)),
    },
    debts: debts.map((debt) => ({
      title: debt.title,
      monthlyPayment: debt.monthlyPayment,
      remainingMonthsInYear: remainingDebtMonthsInYear(
        debt.startMonth,
        debt.months,
        cal.year,
        cal.month,
      ),
      remainingTotal: Number(
        Math.max(0, debt.totalAmount).toFixed(2),
      ),
      archived: Boolean(debt.archived),
    })),
    savingsGoals: goals.map((goal) => ({
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remaining: Number(Math.max(0, goal.targetAmount - goal.currentAmount).toFixed(2)),
      noBudget: Boolean(goal.noBudget),
      archived: Boolean(goal.archived),
    })),
    hints: hints.map((hint) => ({
      title: hint.title,
      month: hint.month,
      remainingThisYear: hint.month >= cal.month && hint.month.startsWith(cal.year),
    })),
    source: 'user',
  };
};

const buildPrompt = (snapshot: BudgetSnapshot): string => `Du bist eine nüchterne Finanzberaterin für ein deutsches Familienbudget (EUR, Zeitzone Berlin).
Antworte ausschließlich auf Deutsch. Keine Namen, keine E-Mails, keine Adressen.

Fokus: Prognose der freien Mittel bis zum 31.12.${snapshot.year} („Freie Mittel bis Jahresende“).

Heute: ${snapshot.today}
Aktueller Monat: ${snapshot.currentMonth}
Verbleibende Monate inkl. laufendem Monat: ${snapshot.remainingMonthsIncludingCurrent}
Volle Folgemonate bis Dezember: ${snapshot.remainingFullMonthsAfterCurrent}
Datenquelle: ${snapshot.source === 'demo' ? 'anonymisiertes Beispielfamilienbudget DE' : 'aggregierte Kontodaten ohne Personenbezug'}

Jahr bis heute:
${JSON.stringify(snapshot.yearToDate)}

Typischer laufender Monat (stabile Einkommen = Gehalt/Business/Investitionen, Pflicht, Raten, variabel):
${JSON.stringify(snapshot.typicalMonth)}

Raten/Schulden:
${JSON.stringify(snapshot.debts)}

Sparziele (noBudget=true zählt nicht als Ausgabe im Budget):
${JSON.stringify(snapshot.savingsGoals)}

Hinweise:
${JSON.stringify(snapshot.hints)}

Berechne projectedYearEndFreeFunds realistisch:
- Bisheriger Jahres-Rest
- plus erwartetes stabiles Einkommen der verbleibenden Monate
- minus Pflicht/Fix jeden Monat
- minus Raten, solange der Plan im Jahr noch läuft
- minus typische variable Ausgaben, sofern sie sich wiederholen
- Sparziele mit noBudget=false können den freien Rest reduzieren, wenn Einzahlungen geplant sind
- einmalige Geschenke/Freelance nicht in Prognosemonate klonen

riskLevel:
- low: solider Puffer
- medium: knapp, aber machbar
- high: Engpass oder Minus bis Jahresende

recommendations: genau 3 konkrete, umsetzbare Schritte (Ausgaben, Raten-Strategie oder Sparziele), um den Jahresend-Rest zu erhöhen.`;

export const analyzeFinances = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        message: 'KI-Prognose ist nicht konfiguriert. GEMINI_API_KEY fehlt.',
      });
      return;
    }

    const userId = ownerId(req);
    const wantDemo = req.body?.useDemoData === true;
    const [txCount, debtCount] = await Promise.all([
      Transaction.countDocuments(byOwner(userId)),
      Debt.countDocuments(byOwner(userId)),
    ]);
    const useDemo = wantDemo || (txCount === 0 && debtCount === 0);
    const snapshot = useDemo ? demoSnapshot() : await snapshotFromUser(userId);

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: buildPrompt(snapshot),
      config: {
        responseMimeType: 'application/json',
        responseSchema: forecastSchema,
      },
    });

    const raw = response.text;
    if (!raw) {
      res.status(502).json({ message: 'Die KI hat keine Prognose geliefert.' });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      res.status(502).json({ message: 'Die KI-Antwort war kein gültiges JSON.' });
      return;
    }

    const checked = aiForecastSchema.safeParse(parsed);
    if (!checked.success) {
      res.status(502).json({ message: 'Die KI-Antwort entsprach nicht dem erwarteten Schema.' });
      return;
    }

    res.status(200).json({
      ...checked.data,
      usedDemoData: useDemo,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/api key|API_KEY|permission|401|403/i.test(message)) {
      res.status(503).json({
        message: 'KI-Prognose ist gerade nicht erreichbar. Bitte API-Schlüssel prüfen.',
      });
      return;
    }
    next(error);
  }
};
