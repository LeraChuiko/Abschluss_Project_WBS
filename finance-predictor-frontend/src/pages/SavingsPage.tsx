import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { PeriodFilter, useCalendarPeriod } from '../components/PeriodFilter.tsx';
import { useFrei } from '../FreiContext.tsx';
import { btnClass, euro, fieldClass, todayIsoDate, toImageSrc } from '../lib/format.ts';
import type { SavingsGoal } from '../types.ts';

type GoalFilter = 'open' | 'done' | 'all' | 'archive';

function berlinYear(iso?: string): string {
  if (!iso) {
    return '';
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
  }).format(new Date(iso));
}

function isOpenGoal(goal: SavingsGoal): boolean {
  return goal.currentAmount < goal.targetAmount;
}

function inSelectedYear(goal: SavingsGoal, year: string): boolean {
  const created = berlinYear(goal.createdAt);
  if (created && created > year) {
    return false;
  }
  if (isOpenGoal(goal)) {
    return true;
  }
  const done = berlinYear(goal.completedAt);
  return !done || done >= year;
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 7h16l-1.2 12.2A2 2 0 0 1 16.81 21H7.19a2 2 0 0 1-1.99-1.8L4 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M3 7h18V5.5A1.5 1.5 0 0 0 19.5 4h-15A1.5 1.5 0 0 0 3 5.5V7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GoalPhoto({ title, imageUrl }: { title: string; imageUrl?: string }) {
  const [broken, setBroken] = useState(false);
  const src = imageUrl ? toImageSrc(imageUrl) : '';
  useEffect(() => {
    setBroken(false);
  }, [src]);
  const show = src && !broken;

  if (!show) {
    return (
      <div className="flex h-44 items-center justify-center bg-violet-100 text-4xl font-semibold text-violet-700">
        {title.trim().slice(0, 1).toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className="h-44 w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export function SavingsPage() {
  const { reload } = useFrei();
  const { year, setYear, thisYear } = useCalendarPeriod();
  const [items, setItems] = useState<Array<SavingsGoal>>([]);
  const [error, setError] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<GoalFilter>('all');

  const load = () => {
    api
      .savingsGoals()
      .then((goals) => setItems(goals as SavingsGoal[]))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    const onReload = () => load();
    window.addEventListener('finance-reload', onReload);
    return () => window.removeEventListener('finance-reload', onReload);
  }, []);

  const deposit = (id: string, affectBudget: boolean) => {
    const amount = Number(amounts[id]);
    if (!amount || amount <= 0) {
      return;
    }
    api
      .depositSavingsGoal(id, { amount, date: todayIsoDate(), affectBudget })
      .then(() => {
        setAmounts((prev) => ({ ...prev, [id]: '' }));
        load();
        reload();
      })
      .catch((err: Error) => setError(err.message));
  };

  const setNoBudget = (id: string, noBudget: boolean) => {
    api
      .updateSavingsGoal(id, { noBudget })
      .then(() => load())
      .catch((err: Error) => setError(err.message));
  };

  const setArchived = (id: string, archived: boolean) => {
    api
      .updateSavingsGoal(id, { archived })
      .then(() => {
        load();
        reload();
      })
      .catch((err: Error) => setError(err.message));
  };

  const visible = [...items]
    .filter((goal) => {
      const archived = Boolean(goal.archived);
      if (filter === 'archive') {
        return archived && year >= thisYear;
      }
      if (archived || !inSelectedYear(goal, year)) {
        return false;
      }
      if (filter === 'open') {
        return isOpenGoal(goal);
      }
      if (filter === 'done') {
        return !isOpenGoal(goal);
      }
      return true;
    })
    .sort((a, b) => {
      const aOpen = isOpenGoal(a) ? 0 : 1;
      const bOpen = isOpenGoal(b) ? 0 : 1;
      return aOpen - bOpen;
    });

  const archiveAllowed = year >= thisYear;
  const filters: { id: GoalFilter; label: string; swatch: string }[] = [
    { id: 'open', label: 'Offen', swatch: 'bg-violet-200' },
    { id: 'done', label: 'Geschafft', swatch: 'bg-emerald-200' },
    { id: 'all', label: 'Alle', swatch: 'bg-sky-200' },
    ...(archiveAllowed
      ? [{ id: 'archive' as const, label: 'Archiv', swatch: 'bg-stone-300' }]
      : []),
  ];

  useEffect(() => {
    if (!archiveAllowed && filter === 'archive') {
      setFilter('all');
    }
  }, [archiveAllowed, filter]);

  return (
    <section className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Sparziele</h1>
          <PeriodFilter year={year} onYear={setYear} />
        </div>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-stone-600">
          {filters.map((item) => {
            const active = filter === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`flex cursor-pointer items-center gap-1.5 ${active ? 'font-semibold text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
                  onClick={() => setFilter(item.id)}
                >
                  <span className={`h-3 w-3 rounded-sm ${item.swatch}`} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {error && <p className="text-red-700">{error}</p>}

      {items.length === 0 ? (
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-stone-600">Noch kein Sparziel. Lege oben rechts ein neues an.</p>
        </article>
      ) : visible.length === 0 ? (
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-stone-600">Keine Sparziele in dieser Ansicht.</p>
        </article>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((g) => {
            const remaining = Math.max(0, Number((g.targetAmount - g.currentAmount).toFixed(2)));
            const percent =
              g.targetAmount > 0
                ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
                : 0;
            return (
              <article key={g._id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative">
                  <GoalPhoto title={g.title} imageUrl={g.imageUrl} />
                  {archiveAllowed && (
                    <button
                      type="button"
                      className="absolute top-2 right-2 z-10 cursor-pointer rounded-lg bg-white/90 p-2 text-stone-700 shadow-sm hover:bg-white"
                      title={g.archived ? 'Aus Archiv holen' : 'Archivieren'}
                      aria-label={g.archived ? 'Aus Archiv holen' : 'Archivieren'}
                      onClick={() => setArchived(g._id, !g.archived)}
                    >
                      <ArchiveIcon />
                    </button>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <h2 className="text-lg font-semibold">{g.title}</h2>
                  <p className="text-2xl font-bold tabular-nums">{euro(g.targetAmount)}</p>
                  <div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={`h-full rounded-full ${remaining <= 0 ? 'bg-emerald-600' : 'bg-violet-600'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-stone-500">
                      {euro(g.currentAmount)} gespart · noch {euro(remaining)}
                    </p>
                  </div>
                  {g.archived ? (
                    <p className="rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
                      Im Archiv. Über das Symbol wieder sichtbar machen.
                    </p>
                  ) : remaining > 0 ? (
                    <form
                      className="space-y-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        deposit(g._id, !g.noBudget);
                      }}
                    >
                      <label className="flex items-center gap-2 text-sm text-stone-600">
                        <input
                          type="checkbox"
                          checked={Boolean(g.noBudget)}
                          onChange={(e) => setNoBudget(g._id, e.target.checked)}
                        />
                        Nicht als Ausgabe
                      </label>
                      <div className="flex items-end gap-2">
                        <label className="min-w-0 flex-1 text-sm text-stone-600">
                          Betrag
                          <input
                            className={`${fieldClass} mt-1 w-full`}
                            type="number"
                            min="0.01"
                            max={remaining}
                            step="0.01"
                            placeholder="Betrag"
                            value={amounts[g._id] ?? ''}
                            onChange={(e) => setAmounts((prev) => ({ ...prev, [g._id]: e.target.value }))}
                            required
                          />
                        </label>
                        <button className={btnClass} type="submit">
                          Speichern
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-900">
                      Geschafft. {g.title} ist geschlossen — {euro(g.targetAmount)} sind beisammen.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
