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
  _id?: unknown;
  type: string;
  title: string;
  amount: number;
  date: Date;
  incomeGroup?: string;
  expenseBlock?: string;
  seriesId?: string;
};

const stampOf = (item: {
  type: string;
  title: string;
  incomeGroup?: string;
  expenseBlock?: string;
  date: Date | string;
}): string => {
  const month = typeof item.date === 'string' ? item.date.slice(0, 7) : monthUtc(item.date);
  const kind = item.expenseBlock || item.incomeGroup || '';
  return `${item.type}|${item.title}|${kind}|${month}`;
};

const shouldForecast = (item: RecurringDoc, uniqueMonths: number): boolean => {
  if (item.type === 'income' && item.incomeGroup && forecastIncome.has(item.incomeGroup)) {
    return uniqueMonths > 1 || Boolean(item.seriesId);
  }
  if (item.type === 'expense' && item.expenseBlock === 'fixed') {
    return true;
  }
  if (item.type === 'expense' && item.expenseBlock === 'variable') {
    return uniqueMonths > 1;
  }
  return false;
};

const queueClone = (
  items: RecurringDoc[],
  until: string,
  cloneFrom: string,
  occupied: Set<string>,
  inserts: Array<Record<string, unknown>>,
): void => {
  const last = [...items].reverse().find((item) => item.amount > 0);
  const keys = items.filter((item) => item.amount > 0).map((item) => monthUtc(item.date));
  const first = keys[0];
  if (!last || !first || until < first) {
    return;
  }
  const uniqueMonths = [...new Set(keys)].length;
  if (!shouldForecast(last, uniqueMonths)) {
    return;
  }
  const expected = expectedMonths(keys, first, until);
  const dayRaw = last.date.getUTCDate();
  const day = dayRaw > 28 ? '01' : String(dayRaw).padStart(2, '0');
  const seriesId = last.seriesId || crypto.randomUUID();
  for (const month of expected) {
    if (month < cloneFrom || month > until) {
      continue;
    }
    const stamp = `${last.type}|${last.title}|${last.expenseBlock || last.incomeGroup || ''}|${month}`;
    if (occupied.has(stamp)) {
      continue;
    }
    occupied.add(stamp);
    inserts.push({
      type: last.type,
      title: last.title,
      amount: last.amount,
      date: new Date(`${month}-${day}T00:00:00.000Z`),
      incomeGroup: last.incomeGroup,
      expenseBlock: last.expenseBlock,
      seriesId,
      importantDate: false,
    });
  }
};

const queueStableIncome = (
  items: RecurringDoc[],
  now: string,
  until: string,
  cloneFrom: string,
  occupied: Set<string>,
  inserts: Array<Record<string, unknown>>,
  patches: Array<{ id: unknown; amount: number }>,
): void => {
  const thisYear = now.slice(0, 4);
  const byMonth = new Map<string, RecurringDoc>();
  for (const item of items) {
    byMonth.set(monthUtc(item.date), item);
  }
  const yearKeys = [...byMonth.keys()]
    .filter((month) => month.startsWith(thisYear) && (byMonth.get(month)?.amount ?? 0) > 0)
    .sort();
  if (yearKeys.length === 0) {
    return;
  }
  const lastYear = byMonth.get(yearKeys[yearKeys.length - 1] ?? '');
  const hasSeries = items.some((item) => Boolean(item.seriesId));
  if (!lastYear || (yearKeys.length <= 1 && !hasSeries)) {
    return;
  }

  let stop = '';
  for (const month of [...byMonth.keys()].sort()) {
    const row = byMonth.get(month);
    if (month >= now && row && row.amount <= 0) {
      stop = month;
      break;
    }
  }

  const amountByCal = new Map<string, number>();
  for (const month of yearKeys) {
    amountByCal.set(month.slice(5, 7), byMonth.get(month)?.amount ?? 0);
  }
  const fallback = lastYear.amount;
  const expected = expectedMonths(yearKeys, yearKeys[0] ?? now, until);
  const dayRaw = lastYear.date.getUTCDate();
  const day = dayRaw > 28 ? '01' : String(dayRaw).padStart(2, '0');
  const seriesId = lastYear.seriesId || crypto.randomUUID();
  const forecastStart = `${Number(thisYear) + 1}-01`;

  for (const month of expected) {
    if (month < cloneFrom || month > until || month < forecastStart) {
      continue;
    }
    if (stop && month >= stop) {
      continue;
    }
    const amount = amountByCal.get(month.slice(5, 7)) || fallback;
    if (amount <= 0) {
      continue;
    }
    const stamp = `income|${lastYear.title}|${lastYear.incomeGroup || ''}|${month}`;
    const existing = byMonth.get(month);
    if (existing) {
      if (existing.amount !== amount) {
        patches.push({ id: existing._id, amount });
      }
      occupied.add(stamp);
      continue;
    }
    if (occupied.has(stamp)) {
      continue;
    }
    occupied.add(stamp);
    inserts.push({
      type: 'income',
      title: lastYear.title,
      amount,
      date: new Date(`${month}-${day}T00:00:00.000Z`),
      incomeGroup: lastYear.incomeGroup,
      seriesId,
      importantDate: false,
    });
  }
};

const queuePflicht = (
  items: RecurringDoc[],
  now: string,
  until: string,
  cloneFrom: string,
  occupied: Set<string>,
  inserts: Array<Record<string, unknown>>,
  dropZero: unknown[],
): void => {
  const byMonth = new Map<string, RecurringDoc>();
  for (const item of items) {
    byMonth.set(monthUtc(item.date), item);
  }
  const months = [...byMonth.keys()].sort();
  let template: RecurringDoc | undefined;
  for (const month of months) {
    if (month > now) {
      break;
    }
    template = byMonth.get(month);
  }
  if (!template) {
    for (const month of months) {
      if (month >= cloneFrom) {
        break;
      }
      template = byMonth.get(month);
    }
  }
  if (!template || template.amount <= 0) {
    return;
  }

  let stop = '';
  for (const month of months) {
    const row = byMonth.get(month);
    if (month >= now && row && row.amount <= 0) {
      stop = month;
      break;
    }
  }

  const dayRaw = template.date.getUTCDate();
  const day = dayRaw > 28 ? '01' : String(dayRaw).padStart(2, '0');
  const seriesId = template.seriesId || crypto.randomUUID();
  let month = cloneFrom;
  while (month <= until) {
    if (stop && month >= stop) {
      break;
    }
    const stamp = `expense|${template.title}|fixed|${month}`;
    const existing = byMonth.get(month);
    if (existing && existing.amount <= 0) {
      dropZero.push(existing._id);
    }
    if (!occupied.has(stamp)) {
      occupied.add(stamp);
      inserts.push({
        type: 'expense',
        title: template.title,
        amount: template.amount,
        date: new Date(`${month}-${day}T00:00:00.000Z`),
        expenseBlock: 'fixed',
        seriesId,
        importantDate: false,
      });
    }
    month = shiftMonth(month, 1);
  }
};

const dedupeRange = async (from: string, to: string): Promise<void> => {
  const rows = (await Transaction.find({
    date: {
      $gte: new Date(`${from}-01T00:00:00.000Z`),
      $lt: new Date(`${shiftMonth(to, 1)}-01T00:00:00.000Z`),
    },
    debtId: { $exists: false },
    savingsGoalId: { $exists: false },
  })
    .sort({ date: 1, _id: 1 })
    .lean()) as RecurringDoc[];
  const seen = new Set<string>();
  const drop: unknown[] = [];
  for (const row of rows) {
    const stamp = stampOf(row);
    if (seen.has(stamp)) {
      drop.push(row._id);
    } else {
      seen.add(stamp);
    }
  }
  if (drop.length > 0) {
    await Transaction.deleteMany({ _id: { $in: drop } });
  }
};

let queue: Promise<void> = Promise.resolve();

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

  await dedupeRange(cloneFrom, until);

  const docs = (await Transaction.find({
    debtId: { $exists: false },
    savingsGoalId: { $exists: false },
  })
    .sort({ date: 1 })
    .lean()) as RecurringDoc[];

  const occupied = new Set<string>();
  for (const doc of docs) {
    if (doc.amount > 0) {
      occupied.add(stampOf(doc));
    }
  }

  const inserts: Array<Record<string, unknown>> = [];
  const dropZero: unknown[] = [];
  const patches: Array<{ id: unknown; amount: number }> = [];
  const bySeries = new Map<string, RecurringDoc[]>();
  for (const doc of docs) {
    if (!doc.seriesId) {
      continue;
    }
    const list = bySeries.get(doc.seriesId) ?? [];
    list.push(doc);
    bySeries.set(doc.seriesId, list);
  }
  for (const items of bySeries.values()) {
    const sample = items[0];
    if (sample?.expenseBlock === 'fixed') {
      continue;
    }
    if (sample?.type === 'income' && sample.incomeGroup && forecastIncome.has(sample.incomeGroup)) {
      continue;
    }
    queueClone(items, until, cloneFrom, occupied, inserts);
  }

  const byTitle = new Map<string, RecurringDoc[]>();
  for (const doc of docs) {
    if (doc.type === 'expense' && doc.expenseBlock === 'fixed') {
      const list = byTitle.get(`pflicht|${doc.title}`) ?? [];
      list.push(doc);
      byTitle.set(`pflicht|${doc.title}`, list);
    }
    if (doc.type === 'income' && doc.incomeGroup && forecastIncome.has(doc.incomeGroup)) {
      const key = `income|${doc.incomeGroup}|${doc.title}`;
      const list = byTitle.get(key) ?? [];
      list.push(doc);
      byTitle.set(key, list);
    }
  }
  for (const [key, items] of byTitle) {
    if (key.startsWith('pflicht|')) {
      queuePflicht(items, now, until, cloneFrom, occupied, inserts, dropZero);
    } else {
      queueStableIncome(items, now, until, cloneFrom, occupied, inserts, patches);
    }
  }

  if (dropZero.length > 0) {
    await Transaction.deleteMany({ _id: { $in: dropZero } });
  }
  for (const patch of patches) {
    await Transaction.updateOne({ _id: patch.id }, { amount: patch.amount });
  }
  if (inserts.length > 0) {
    await Transaction.insertMany(inserts);
  }
};

export const ensureRecurringForRange = (from: string, to: string): Promise<void> => {
  const job = queue.then(() => runEnsureRecurringForRange(from, to));
  queue = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
};

export const ensureRecurringForMonth = (month: string): Promise<void> =>
  ensureRecurringForRange(month, month);
