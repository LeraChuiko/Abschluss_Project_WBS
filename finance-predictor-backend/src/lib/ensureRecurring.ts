import { Transaction } from '../models/Transaction.ts';

const forecastIncome = new Set(['salary', 'business', 'investment']);

const berlinMonthNow = (): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
};

const monthUtc = (date: Date): string => date.toISOString().slice(0, 7);

const shiftMonth = (month: string, add: number): string => {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const date = new Date(Date.UTC(year, m - 1 + add, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

const horizonMonth = (): string => '2091-12';

const expectedMonths = (keys: string[], first: string, until: string): Set<string> => {
  const unique = [...new Set(keys)].sort();
  const out = new Set<string>();
  if (unique.length <= 1) {
    let cursor = first;
    while (cursor <= until) {
      out.add(cursor);
      cursor = shiftMonth(cursor, 1);
    }
    return out;
  }

  const diffs: number[] = [];
  for (let i = 1; i < unique.length; i += 1) {
    const prev = unique[i - 1] ?? '';
    const next = unique[i] ?? '';
    const y1 = Number(prev.slice(0, 4));
    const m1 = Number(prev.slice(5, 7));
    const y2 = Number(next.slice(0, 4));
    const m2 = Number(next.slice(5, 7));
    diffs.push(y2 * 12 + m2 - (y1 * 12 + m1));
  }
  const step = diffs[0] ?? 0;
  if (step > 0 && diffs.every((d) => d === step)) {
    let cursor = first;
    while (cursor <= until) {
      out.add(cursor);
      cursor = shiftMonth(cursor, step);
    }
    return out;
  }

  const custom = [...new Set(unique.map((key) => Number(key.slice(5, 7))))];
  const startY = Number(first.slice(0, 4));
  const endY = Number(until.slice(0, 4));
  for (let year = startY; year <= endY; year += 1) {
    for (const month of custom) {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      if (key >= first && key <= until) {
        out.add(key);
      }
    }
  }
  return out;
};

type RecurringDoc = {
  type: string;
  title: string;
  amount: number;
  date: Date;
  incomeGroup?: string;
  expenseBlock?: string;
  seriesId?: string;
};

const inflight = new Map<string, Promise<void>>();

const runEnsureRecurringForRange = async (from: string, to: string): Promise<void> => {
  const cap = horizonMonth();
  const now = berlinMonthNow();
  const until = to > cap ? cap : to;
  const cloneFrom = from > now ? from : shiftMonth(now, 1);
  if (cloneFrom > until) {
    return;
  }

  const nextYear = String(Number(now.slice(0, 4)) + 1);
  await Transaction.deleteMany({
    type: 'income',
    incomeGroup: { $in: ['freelance', 'gift'] },
    date: { $gte: new Date(`${nextYear}-01-01T00:00:00.000Z`) },
  });

  const docs = (await Transaction.find({
    seriesId: { $nin: [null, ''] },
    debtId: { $exists: false },
    savingsGoalId: { $exists: false },
  })
    .sort({ date: 1 })
    .lean()) as RecurringDoc[];

  const bySeries = new Map<string, RecurringDoc[]>();
  for (const doc of docs) {
    if (!doc.seriesId) {
      continue;
    }
    const list = bySeries.get(doc.seriesId) ?? [];
    list.push(doc);
    bySeries.set(doc.seriesId, list);
  }

  const inserts: Array<Record<string, unknown>> = [];
  for (const items of bySeries.values()) {
    const sample = items[0];
    const keys = items.map((item) => monthUtc(item.date));
    const first = keys[0];
    const latest = items[items.length - 1];
    const last = [...items].reverse().find((item) => item.amount > 0);
    if (!sample || !first || !last || !latest || until < first || latest.amount <= 0) {
      continue;
    }

    const uniqueMonths = [...new Set(keys)];
    const incomeForecast =
      sample.type === 'income' &&
      sample.incomeGroup &&
      forecastIncome.has(sample.incomeGroup) &&
      uniqueMonths.length > 1;
    const PflichtForecast = sample.type === 'expense' && sample.expenseBlock === 'fixed';
    const repeatVariable =
      sample.type === 'expense' && sample.expenseBlock === 'variable' && uniqueMonths.length > 1;
    if (!incomeForecast && !PflichtForecast && !repeatVariable) {
      continue;
    }

    const expected = expectedMonths(keys, first, until);
    const have = new Set(keys);
    const dayRaw = last.date.getUTCDate();
    const day = dayRaw > 28 ? '01' : String(dayRaw).padStart(2, '0');

    for (const month of expected) {
      if (month < cloneFrom || month > until || have.has(month)) {
        continue;
      }
      inserts.push({
        type: last.type,
        title: last.title,
        amount: last.amount,
        date: new Date(`${month}-${day}T00:00:00.000Z`),
        incomeGroup: last.incomeGroup,
        expenseBlock: last.expenseBlock,
        seriesId: last.seriesId,
        importantDate: false,
      });
    }
  }

  const occupied = new Set<string>();
  for (const doc of docs) {
    if (doc.type === 'expense' && doc.expenseBlock === 'fixed') {
      occupied.add(`${doc.title}|${monthUtc(doc.date)}`);
    }
  }
  for (const row of inserts) {
    if (row.expenseBlock === 'fixed' && row.date instanceof Date) {
      occupied.add(`${String(row.title)}|${monthUtc(row.date)}`);
    }
  }

  const fixedByTitle = new Map<string, RecurringDoc[]>();
  for (const doc of docs) {
    if (doc.type !== 'expense' || doc.expenseBlock !== 'fixed') {
      continue;
    }
    const list = fixedByTitle.get(doc.title) ?? [];
    list.push(doc);
    fixedByTitle.set(doc.title, list);
  }
  for (const [title, items] of fixedByTitle) {
    const latest = items[items.length - 1];
    const last = [...items].reverse().find((item) => item.amount > 0);
    const keys = items.filter((item) => item.amount > 0).map((item) => monthUtc(item.date));
    const first = keys[0];
    if (!first || !last || !latest || latest.amount <= 0) {
      continue;
    }
    const expected = expectedMonths(keys, first, until);
    const dayRaw = last.date.getUTCDate();
    const day = dayRaw > 28 ? '01' : String(dayRaw).padStart(2, '0');
    const seriesId = last.seriesId || crypto.randomUUID();
    for (const month of expected) {
      if (month < cloneFrom || month > until || occupied.has(`${title}|${month}`)) {
        continue;
      }
      inserts.push({
        type: 'expense',
        title,
        amount: last.amount,
        date: new Date(`${month}-${day}T00:00:00.000Z`),
        expenseBlock: 'fixed',
        seriesId,
        importantDate: false,
      });
      occupied.add(`${title}|${month}`);
    }
  }

  if (inserts.length > 0) {
    await Transaction.insertMany(inserts);
  }
};

export const ensureRecurringForRange = (from: string, to: string): Promise<void> => {
  const key = `${from}:${to}`;
  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }
  const job = runEnsureRecurringForRange(from, to).finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, job);
  return job;
};

export const ensureRecurringForMonth = (month: string): Promise<void> =>
  ensureRecurringForRange(month, month);
