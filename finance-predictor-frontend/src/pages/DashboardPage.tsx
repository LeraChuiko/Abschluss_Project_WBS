import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.ts';
import { useFrei } from '../FreiContext.tsx';
import { AmountEdit } from '../components/AmountEdit.tsx';
import { PeriodFilter, useCalendarPeriod } from '../components/PeriodFilter.tsx';
import { euro, monthName, isEditableMonth } from '../lib/format.ts';
import type { Dashboard, ExpenseBlock, Transaction } from '../types.ts';

const blocks: { key: ExpenseBlock; label: string; wrap: string }[] = [
  { key: 'fixed', label: 'Pflicht / Fix', wrap: 'bg-sky-50' },
  { key: 'periodic', label: 'Raten', wrap: 'bg-fuchsia-50' },
  { key: 'variable', label: 'Variabel', wrap: 'bg-emerald-50' },
];

type MonthTable = {
  month: string;
  dashboard: Dashboard;
  incomes: Transaction[];
  expenses: Transaction[];
};

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { timeZone: 'UTC' });
}

export function DashboardPage() {
  const { year, setYear } = useCalendarPeriod();
  const [tables, setTables] = useState<MonthTable[]>([]);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([
      api.dashboardYear(year) as Promise<{ year: string; months: Dashboard[] }>,
      api.transactionsYear(year) as Promise<Transaction[]>,
    ])
      .then(([dash, list]) => {
        setTables(
          dash.months.map((dashboard) => ({
            month: dashboard.month,
            dashboard,
            incomes: list.filter((t) => t.type === 'income' && t.date.slice(0, 7) === dashboard.month),
            expenses: list.filter((t) => t.type === 'expense' && t.date.slice(0, 7) === dashboard.month),
          })),
        );
      })
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    const onReload = () => load();
    window.addEventListener('finance-reload', onReload);
    return () => window.removeEventListener('finance-reload', onReload);
  }, [year]);

  const periodIncome = tables.reduce((sum, table) => sum + table.dashboard.incomeTotal, 0);
  const periodExpense = tables.reduce((sum, table) => sum + table.dashboard.expenseTotal, 0);
  const periodRest = periodIncome - periodExpense;
  const periodRestClass = periodRest < 0 ? 'text-red-700' : 'text-violet-800';

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget</h1>
          <ul className="mt-3 flex flex-wrap gap-3 text-xs text-stone-600">
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-sky-200" /> Pflicht / Fix
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-fuchsia-200" /> Raten
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-200" /> Variabel
            </li>
          </ul>
        </div>
        <PeriodFilter year={year} onYear={setYear} />
      </div>

      {error && <p className="text-red-700">{error}</p>}

      <article className="rounded-2xl bg-white px-4 py-3 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">Gewählter Zeitraum</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-stone-500">Einnahmen</p>
            <p className="text-lg font-semibold tabular-nums">{euro(periodIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Ausgaben</p>
            <p className="text-lg font-semibold tabular-nums">{euro(periodExpense)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-600">Rest</p>
            <p className={`text-lg font-bold tabular-nums ${periodRestClass}`}>{euro(periodRest)}</p>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => (
          <MonthSheet key={table.month} table={table} onError={setError} />
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Link
          to="/hinweise"
          className="rounded-full bg-violet-700 px-6 py-3 text-sm font-semibold text-white"
        >
          Zu den Hinweisen
        </Link>
      </div>
    </section>
  );
}

function lineDate(t: Transaction): string | undefined {
  return t.importantDate ? t.date : undefined;
}

function MonthSheet({ table, onError }: { table: MonthTable; onError: (msg: string) => void }) {
  const { dashboard, expenses, month } = table;
  const locked = !isEditableMonth(month);
  const restClass =
    dashboard.balance < 0 ? 'text-red-700' : 'text-violet-800';

  return (
    <article className="h-fit min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm">
      <header className="border-b border-stone-200 bg-stone-100 px-3 py-3">
        <p className="leading-tight">
          <span className="text-lg font-bold text-stone-900">{monthName(month)}</span>
          <span className="ml-2 text-sm font-normal text-stone-400">{month.slice(0, 4)}</span>
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
          <div>
            <p className="text-stone-500">Einnahmen</p>
            <p className="tabular-nums text-stone-700">{euro(dashboard.incomeTotal)}</p>
          </div>
          <div>
            <p className="text-stone-500">Ausgaben</p>
            <p className="tabular-nums text-stone-700">{euro(dashboard.expenseTotal)}</p>
          </div>
          <div>
            <p className="font-medium text-stone-600">Rest</p>
            <p className={`text-base leading-tight font-bold tabular-nums ${restClass}`}>
              {euro(dashboard.balance)}
            </p>
          </div>
        </div>
      </header>

      {blocks.map((b) => {
        const rows = expenses.filter((t) => {
          if (t.expenseBlock !== b.key) {
            return false;
          }
          if (b.key === 'periodic' && t.amount === 0) {
            return false;
          }
          return true;
        });
        if (rows.length === 0) {
          return null;
        }
        return (
          <div key={b.key} className={`px-3 py-2 ${b.wrap}`}>
            {rows.map((t) => (
              <Line key={t._id} tx={t} locked={locked} date={lineDate(t)} onError={onError} />
            ))}
          </div>
        );
      })}
    </article>
  );
}

function Line({
  tx,
  locked,
  date,
  onError,
}: {
  tx: Transaction;
  locked: boolean;
  date?: string;
  onError: (msg: string) => void;
}) {
  const { reload } = useFrei();

  return (
    <div className="group/line relative flex items-start gap-2 border-b border-stone-200/70 py-1.5 last:border-0">
      {locked ? (
        <p className="w-28 shrink-0 tabular-nums">{euro(tx.amount)}</p>
      ) : (
        <AmountEdit
          value={tx.amount}
          canEdit={true}
          onSave={(amount) => {
            onError('');
            api
              .updateTransaction(tx._id, { amount })
              .then(() => reload())
              .catch((err: Error) => onError(err.message));
          }}
        />
      )}
      <div className="min-w-0">
        <p className="leading-tight font-medium break-words">{tx.title}</p>
        {date && <p className="text-xs text-stone-500">{formatDay(date)}</p>}
      </div>
    </div>
  );
}
