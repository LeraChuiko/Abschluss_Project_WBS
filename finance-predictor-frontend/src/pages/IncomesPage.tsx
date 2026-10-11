import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { AmountEdit } from '../components/AmountEdit.tsx';
import { useFrei } from '../FreiContext.tsx';
import { euro, fieldClass, monthLabel, monthsInRange, isEditableMonth } from '../lib/format.ts';
import type { IncomeGroup, Transaction } from '../types.ts';

const groups: { key: IncomeGroup; label: string; wrap: string; mark: string }[] = [
  { key: 'salary', label: 'Gehalt / Job', wrap: 'bg-sky-50', mark: 'bg-sky-200' },
  { key: 'business', label: 'Business', wrap: 'bg-violet-50', mark: 'bg-violet-200' },
  { key: 'freelance', label: 'Freelance', wrap: 'bg-amber-50', mark: 'bg-amber-200' },
  { key: 'gift', label: 'Geschenke / Wunder', wrap: 'bg-fuchsia-50', mark: 'bg-fuchsia-200' },
  { key: 'investment', label: 'Investitionen', wrap: 'bg-indigo-50', mark: 'bg-indigo-200' },
];

function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { timeZone: 'UTC' });
}

export function IncomesPage() {
  const { reload } = useFrei();
  const year = new Date().getFullYear();
  const [fromMonth, setFromMonth] = useState(`${year}-01`);
  const [toMonth, setToMonth] = useState(`${year}-12`);
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api
      .transactions()
      .then((json) => setIncomes((json as Transaction[]).filter((t) => t.type === 'income')))
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
  const months = monthsInRange(start, end);
  const visible = incomes.filter((t) => {
    const month = monthOf(t.date);
    return month >= start && month <= end;
  });

  const byGroup = groups.map((g) => ({
    ...g,
    sum: visible.filter((t) => t.incomeGroup === g.key).reduce((acc, t) => acc + t.amount, 0),
  }));
  const total = byGroup.reduce((acc, g) => acc + g.sum, 0);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Einnahmen</h1>
        <p className="mt-2 text-stone-500">Oben die Summe nach Kategorie. Darunter die Monate.</p>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-stone-600">
          {groups.map((g) => (
            <li key={g.key} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-sm ${g.mark}`} /> {g.label}
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="text-red-700">{error}</p>}

      <article className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-500">Gewählter Zeitraum nach Kategorie</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{euro(total)}</p>
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
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {byGroup.map((g) => (
            <li key={g.key} className={`rounded-xl px-3 py-2 ${g.wrap}`}>
              <p className="text-xs text-stone-500">{g.label}</p>
              <p className="font-semibold tabular-nums">{euro(g.sum)}</p>
            </li>
          ))}
        </ul>
      </article>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => {
          const rows = visible.filter((t) => monthOf(t.date) === month);
          const monthTotal = rows.reduce((acc, t) => acc + t.amount, 0);
          return (
            <article key={month} className="h-fit overflow-hidden rounded-2xl bg-white shadow-sm">
              <header className="border-b border-stone-200 bg-stone-100 px-3 py-2">
                <p className="font-semibold">{monthLabel(month)}</p>
                <p className="mt-1 text-xs text-stone-600 tabular-nums">{euro(monthTotal)}</p>
              </header>
              {groups.map((g) => {
                const list = rows.filter((t) => t.incomeGroup === g.key && t.amount > 0);
                if (list.length === 0) {
                  return null;
                }
                return (
                  <div key={g.key} className={`border-b border-stone-100 px-3 py-2 last:border-0 ${g.wrap}`}>
                    <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{g.label}</p>
                    {list.map((t) => (
                      <div key={t._id} className="group/line flex items-start gap-2 py-1.5">
                        {isEditableMonth(month) ? (
                          <AmountEdit
                            value={t.amount}
                            canEdit={true}
                            onSave={(amount) => {
                              api.updateTransaction(t._id, { amount }).then(() => reload()).catch(() => {});
                            }}
                          />
                        ) : (
                          <p className="w-28 shrink-0 tabular-nums">{euro(t.amount)}</p>
                        )}
                        <div className="min-w-0">
                          <p className="leading-tight font-medium break-words">{t.title}</p>
                          <p className="text-xs text-stone-500">{formatDay(t.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </article>
          );
        })}
      </div>
    </section>
  );
}
