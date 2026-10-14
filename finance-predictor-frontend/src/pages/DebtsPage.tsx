import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { AmountEdit } from '../components/AmountEdit.tsx';
import { PeriodFilter, useCalendarPeriod } from '../components/PeriodFilter.tsx';
import { useFrei } from '../FreiContext.tsx';
import {
  euro,
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
  const { year, setYear, start, end, setStart, setEnd } = useCalendarPeriod();
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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raten</h1>
          <ul className="mt-3 flex flex-wrap gap-3 text-xs text-stone-600">
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-200" /> Bezahlt
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-amber-200" /> Erwartet
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-stone-300" /> Geschlossen
            </li>
          </ul>
        </div>
        <PeriodFilter
          year={year}
          onYear={setYear}
          start={start}
          end={end}
          onStart={setStart}
          onEnd={setEnd}
        />
      </div>
      {error && <p className="text-red-700">{error}</p>}

      {(() => {
        const rows = items
          .map((d) => {
            const related = txs.filter((t) => sameId(t.debtId, d._id));
            const closed = Boolean(d.archived) || isDebtClosed(d, related);
            return { d, related, closed };
          })
          .filter(({ d }) => debtMonths(d).some((m) => m >= start && m <= end));
        const active = rows.filter((row) => !row.closed);
        const archived = rows.filter((row) => row.closed);
        const renderRow = (row: (typeof rows)[number]) => {
        const { d, related, closed } = row;
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
              {closed ? (
                <button
                  type="button"
                  className="ml-auto cursor-pointer rounded-lg border border-stone-300 px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 active:bg-stone-200"
                  onClick={() => {
                    const ok = window.confirm(
                      `Kauf „${d.title}“ aus dem Archiv löschen? Alle Raten werden entfernt.`,
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
                  Löschen
                </button>
              ) : (
                <button
                  type="button"
                  className="ml-auto cursor-pointer rounded-lg border border-stone-300 px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 active:bg-stone-200"
                  onClick={() => {
                    api
                      .updateDebt(d._id, { archived: true })
                      .then(load)
                      .catch((err: Error) => setError(err.message));
                  }}
                >
                  Schließen
                </button>
              )}
            </header>
            {months.length === 0 ? (
              <p className="px-5 py-3 text-sm text-stone-400">Kein Monat in diesem Zeitraum.</p>
            ) : (
              <div className={`overflow-x-auto ${closed ? 'bg-stone-100' : 'bg-white'}`}>
              <table
                className={`w-full table-fixed border-collapse text-left text-sm ${closed ? 'bg-stone-100' : 'bg-white'}`}
                style={
                  months.length > 12 ? { minWidth: `${months.length * 5.5}rem` } : undefined
                }
              >
                <thead className={`text-xs tracking-wide uppercase ${closed ? 'bg-stone-200 text-stone-600' : 'bg-stone-100 text-stone-500'}`}>
                  <tr>
                    {months.map((m, index) => (
                      <th
                        key={m}
                        className={`py-2 font-medium whitespace-nowrap ${index === 0 ? 'pl-5 pr-2 text-left' : 'px-2'}`}
                      >
                        {shortMonthLabel(m)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {months.map((m, index) => {
                      const cell = cells[m];
                      const monthTx = related.find((t) => monthKey(t.date) === m);
                      const show = cell && monthTx && monthTx.amount > 0;
                      return (
                        <td
                          key={m}
                          className={`group/line p-0 align-top text-left ${
                            closed
                              ? 'bg-stone-200 text-stone-600'
                              : show
                                ? plaqueClass(monthTx.date)
                                : 'bg-white'
                          }`}
                        >
                          {show ? (
                            <div className={`py-2 ${index === 0 ? 'pl-5 pr-2' : 'px-2'}`}>
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
                            <span className={`inline-block py-2 text-stone-300 ${index === 0 ? 'pl-5 pr-2' : 'px-2'}`}>
                              —
                            </span>
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
        };
        return (
          <>
            {active.length === 0 && archived.length === 0 && (
              <article className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-stone-600">Für diesen Zeitraum gibt es keine Daten.</p>
              </article>
            )}
            {active.map(renderRow)}
            {archived.length > 0 && (
              <div className="space-y-4 pt-2">
                <h2 className="text-lg font-semibold text-stone-500">Archiv</h2>
                {archived.map(renderRow)}
              </div>
            )}
          </>
        );
      })()}
    </section>
  );
}
