import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { AmountEdit } from '../components/AmountEdit.tsx';
import { useFrei } from '../FreiContext.tsx';
import {
  euro,
  fieldClass,
  shortMonthLabel,
  shiftMonth,
  isEditableMonth,
  currentMonthKey,
  todayIsoDate,
} from '../lib/format.ts';
import type { Debt, Transaction } from '../types.ts';

function monthKey(iso: string): string {
  const text = String(iso);
  const match = text.match(/^(\d{4}-\d{2})/);
  if (match) {
    return match[1];
  }
  const date = new Date(iso);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function dayKey(iso: string): string {
  const text = String(iso);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  return text.slice(0, 10);
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { timeZone: 'UTC' });
}

function sameId(left?: string, right?: string): boolean {
  return String(left) === String(right);
}

function debtMonths(debt: Debt): string[] {
  return Array.from({ length: debt.months }, (_, i) => shiftMonth(debt.startMonth, i));
}

function restByMonth(debt: Debt, txs: Transaction[]): Record<string, { paid: number; rest: number }> {
  let rest = debt.totalAmount;
  const map: Record<string, { paid: number; rest: number }> = {};
  for (const month of debtMonths(debt)) {
    const paid = txs
      .filter((t) => monthKey(t.date) === month)
      .reduce((sum, t) => sum + t.amount, 0);
    rest = Math.max(0, Number((rest - paid).toFixed(2)));
    map[month] = { paid, rest };
  }
  return map;
}

function restNow(debt: Debt, txs: Transaction[]): number {
  const until = currentMonthKey();
  const paid = txs
    .filter((t) => monthKey(t.date) <= until)
    .reduce((sum, t) => sum + t.amount, 0);
  return Math.max(0, Number((debt.totalAmount - paid).toFixed(2)));
}

function isDebtClosed(debt: Debt, txs: Transaction[]): boolean {
  const today = todayIsoDate();
  const stillDue = txs.some((t) => t.amount > 0 && dayKey(t.date) > today);
  if (stillDue) {
    return false;
  }
  return restNow(debt, txs) <= 0;
}

function plaqueClass(iso: string): string {
  return dayKey(iso) <= todayIsoDate()
    ? 'bg-emerald-50 text-emerald-900'
    : 'bg-amber-50 text-amber-950';
}

export function DebtsPage() {
  const { reload } = useFrei();
  const year = new Date().getFullYear();
  const [fromMonth, setFromMonth] = useState(`${year}-01`);
  const [toMonth, setToMonth] = useState(`${year}-12`);
  const [items, setItems] = useState<Array<Debt>>([]);
  const [txs, setTxs] = useState<Array<Transaction>>([]);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([
      api.debts() as Promise<Array<Debt>>,
      api.transactions() as Promise<Array<Transaction>>,
    ])
      .then(([debts, list]) => {
        setItems(debts);
        setTxs(list.filter((t) => Boolean(t.debtId)));
      })
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    const onReload = () => load();
    window.addEventListener('finance-reload', onReload);
    return () => window.removeEventListener('finance-reload', onReload);
  }, []);

  const start = fromMonth <= toMonth ? fromMonth : toMonth;
  const end = fromMonth <= toMonth ? toMonth : fromMonth;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raten</h1>
          <p className="mt-2 text-stone-500">
            Eine Tabelle je Vertrag. Bezahlt wird grün, noch offen gelb. Farbe folgt dem Datum.
          </p>
          <ul className="mt-3 flex flex-wrap gap-3 text-xs text-stone-600">
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-200" /> Bezahlt
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-amber-200" /> Erwartet
            </li>
          </ul>
        </div>
        <div className="flex w-full flex-col gap-3 text-sm text-stone-600 sm:w-auto sm:flex-row sm:items-center">
          <label className="flex items-center">
            Von
            <input
              className={`${fieldClass} period-month ml-2`}
              type="month"
              value={fromMonth}
              onChange={(e) => setFromMonth(e.target.value)}
            />
          </label>
          <label className="flex items-center">
            Bis
            <input
              className={`${fieldClass} period-month ml-2`}
              type="month"
              value={toMonth}
              onChange={(e) => setToMonth(e.target.value)}
            />
          </label>
        </div>
      </div>
      {error && <p className="text-red-700">{error}</p>}

      {items
        .map((d) => {
          const related = txs.filter((t) => sameId(t.debtId, d._id));
          return { d, related, closed: isDebtClosed(d, related) };
        })
        .filter(({ d }) => debtMonths(d).some((m) => m >= start && m <= end))
        .sort((a, b) => Number(a.closed) - Number(b.closed))
        .map(({ d, related, closed }) => {
        const cells = restByMonth(d, related);
        const open = restNow(d, related);
        const months = debtMonths(d);
        return (
          <article
            key={d._id}
            className={`overflow-hidden rounded-2xl shadow-sm ${closed ? 'bg-stone-100 text-stone-500' : 'bg-white'}`}
          >
            <header
              className={`flex h-14 items-center gap-3 px-5 ${closed ? 'border-b border-stone-200' : 'border-b border-stone-100'}`}
            >
              <p className="max-w-[12rem] truncate text-lg leading-none font-semibold">{d.title}</p>
              <p className="text-lg leading-none font-bold tabular-nums">{euro(d.totalAmount)}</p>
              <p className="text-lg leading-none tabular-nums">
                <span className="mr-1.5 text-sm font-medium text-stone-500">Rest</span>
                <span className={`font-semibold ${closed ? 'text-stone-500' : 'text-violet-800'}`}>
                  {euro(open)}
                </span>
              </p>
              <button
                type="button"
                className="ml-auto rounded-full border border-stone-300 px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                onClick={() => {
                  const ok = window.confirm(
                    `Kauf „${d.title}“ wirklich löschen? Alle Raten werden entfernt.`,
                  );
                  if (!ok) {
                    return;
                  }
                  api
                    .deleteDebt(d._id)
                    .then(() => {
                      load();
                      reload();
                    })
                    .catch((err: Error) => setError(err.message));
                }}
              >
                Kauf löschen
              </button>
            </header>
            {months.length === 0 ? (
              <p className="px-4 py-3 text-sm text-stone-400">Kein Monat in diesem Zeitraum.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-max min-w-full border-collapse text-left text-sm">
                <thead className={`text-xs tracking-wide uppercase ${closed ? 'bg-stone-200 text-stone-600' : 'bg-stone-100 text-stone-500'}`}>
                  <tr>
                    {months.map((m) => (
                      <th key={m} className="min-w-[6.5rem] px-2 py-2 font-medium whitespace-nowrap">
                        {shortMonthLabel(m)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {months.map((m) => {
                      const cell = cells[m];
                      const monthTx = related.find((t) => monthKey(t.date) === m);
                      const show = cell && monthTx && monthTx.amount > 0;
                      return (
                        <td key={m} className="group/line min-w-[6.5rem] p-0 align-top">
                          {show ? (
                            <div
                              className={`px-2 py-2 ${closed ? 'bg-stone-200 text-stone-600' : plaqueClass(monthTx.date)}`}
                            >
                              <p className="text-xs opacity-80">{formatDay(monthTx.date)}</p>
                              {isEditableMonth(m) ? (
                                <AmountEdit
                                  value={monthTx.amount}
                                  canEdit={true}
                                  compact={true}
                                  onSave={(amount) => {
                                    setError('');
                                    api
                                      .updateTransaction(monthTx._id, { amount })
                                      .then(() => reload())
                                      .catch((err: Error) => setError(err.message));
                                  }}
                                />
                              ) : (
                                <p className="font-medium tabular-nums">{euro(monthTx.amount)}</p>
                              )}
                              <p className="mt-1 text-xs opacity-80">Rest {euro(cell.rest)}</p>
                            </div>
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
