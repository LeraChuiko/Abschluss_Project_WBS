import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../api.ts';
import { PeriodFilter, useCalendarPeriod } from '../components/PeriodFilter.tsx';
import { currentMonthKey, hintOccurrences, monthLabel } from '../lib/format.ts';
import type { Hinweis } from '../types.ts';

type Row = {
  key: string;
  series: Hinweis;
  month: string;
  done: boolean;
};

function calendarMonthName(monthNumber: number): string {
  return new Date(Date.UTC(2026, monthNumber - 1, 1)).toLocaleDateString('de-DE', {
    month: 'long',
    timeZone: 'UTC',
  });
}

function joinDe(names: string[]): string {
  if (names.length <= 1) {
    return names[0] ?? '';
  }
  if (names.length === 2) {
    return `${names[0]} und ${names[1]}`;
  }
  return `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`;
}

function untilPhrase(endMonth?: string, yearly = false): string {
  if (!endMonth) {
    return '';
  }
  if (yearly) {
    return ` bis ${endMonth.slice(0, 4)}`;
  }
  return ` bis ${monthLabel(endMonth)}`;
}

function intervalLabel(item: Hinweis): string {
  const custom = [...(item.customMonths ?? [])].sort((a, b) => a - b);
  const startName = calendarMonthName(Number(item.month.slice(5, 7)));
  if (custom.length > 0) {
    const names = joinDe(custom.map(calendarMonthName));
    return `Wiederholung im ${names}, jährlich${untilPhrase(item.endMonth, true)}`;
  }
  const every = item.everyMonths ?? 0;
  if (!every) {
    return 'einmal';
  }
  if (every === 12) {
    return `Wiederholung im ${startName}, jährlich${untilPhrase(item.endMonth, true)}`;
  }
  if (every === 1) {
    return `jeden Monat${untilPhrase(item.endMonth)}`;
  }
  if (every === 6) {
    return `alle 6 Monate ab ${startName}${untilPhrase(item.endMonth)}`;
  }
  if (every === 3) {
    return `alle 3 Monate ab ${startName}${untilPhrase(item.endMonth)}`;
  }
  return `alle ${every} Monate ab ${startName}${untilPhrase(item.endMonth)}`;
}

function HintIcon({
  label,
  tone,
  onClick,
  children,
}: {
  label: string;
  tone: 'done' | 'restore' | 'delete';
  onClick: () => void;
  children: ReactNode;
}) {
  const hover =
    tone === 'done'
      ? 'hover:border-emerald-600 hover:bg-emerald-600 hover:text-white'
      : tone === 'restore'
        ? 'hover:border-violet-700 hover:bg-violet-700 hover:text-white'
        : 'hover:border-red-600 hover:bg-red-600 hover:text-white';

  return (
    <span className="group/tip relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-600 shadow-sm transition active:brightness-90 ${hover}`}
        onClick={onClick}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute right-0 bottom-full z-10 mb-1 hidden rounded-md bg-stone-800 px-2 py-1 text-xs whitespace-nowrap text-white group-hover/tip:block">
        {label}
      </span>
    </span>
  );
}

function cardClass(row: Row, now: string): string {
  if (row.done) {
    return 'bg-stone-200 text-stone-500';
  }
  if (row.month > now) {
    return 'bg-amber-50 text-amber-950';
  }
  if (row.month < now) {
    return 'bg-rose-50 text-rose-950';
  }
  return 'bg-emerald-50 text-emerald-950';
}

export function ForecastPage() {
  const now = currentMonthKey();
  const { year, setYear, start, end } = useCalendarPeriod();
  const [items, setItems] = useState<Array<Hinweis>>([]);
  const [error, setError] = useState('');

  const load = () => {
    api
      .hinweise()
      .then((json) => setItems(json as Array<Hinweis>))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    const onReload = () => load();
    window.addEventListener('finance-reload', onReload);
    return () => window.removeEventListener('finance-reload', onReload);
  }, []);

  const rows: Array<Row> = [];
  for (const item of items) {
    const seriesEnd = item.endMonth || end;
    const occs = hintOccurrences(item.month, seriesEnd, item.everyMonths ?? 0, item.customMonths ?? []);
    const doneSet = new Set(item.doneMonths ?? []);
    for (const month of occs) {
      if (month < start || month > end) {
        continue;
      }
      rows.push({
        key: `${item._id}-${month}`,
        series: item,
        month,
        done: doneSet.has(month) || (Boolean(item.done) && month <= now),
      });
    }
  }
  rows.sort((a, b) => {
    if (a.done !== b.done) {
      return Number(a.done) - Number(b.done);
    }
    return a.month.localeCompare(b.month);
  });

  const markDone = (row: Row) => {
    const prev = row.series.doneMonths ?? [];
    api
      .updateHinweis(row.series._id, { doneMonths: [...new Set([...prev, row.month])] })
      .then(load)
      .catch((err: Error) => setError(err.message));
  };

  const reactivate = (row: Row) => {
    const next = (row.series.doneMonths ?? []).filter((month) => month !== row.month);
    api
      .updateHinweis(row.series._id, { doneMonths: next, done: false })
      .then(load)
      .catch((err: Error) => setError(err.message));
  };

  const removeHint = (row: Row) => {
    const ok = window.confirm(`Hinweis „${row.series.title}“ wirklich löschen?`);
    if (!ok) {
      return;
    }
    api
      .deleteHinweis(row.series._id)
      .then(load)
      .catch((err: Error) => setError(err.message));
  };

  const activeRows = rows.filter((row) => !row.done);
  const archivedRows = rows.filter((row) => row.done);

  const hintCard = (row: Row) => (
    <li key={row.key} className={`flex h-full flex-col rounded-2xl p-4 shadow-sm ${cardClass(row, now)}`}>
      <h2 className="line-clamp-2 text-base leading-6 font-semibold">{row.series.title}</h2>
      {row.series.note ? (
        <p className="mt-2 line-clamp-3 text-sm leading-5 opacity-80">{row.series.note}</p>
      ) : null}
      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <div className="min-w-0">
          <p className="text-xs font-medium opacity-80">{monthLabel(row.month)}</p>
          <p className="mt-0.5 text-xs opacity-70">{intervalLabel(row.series)}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {row.done ? (
            <>
              <HintIcon label="Aktivieren" tone="restore" onClick={() => reactivate(row)}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v5h5" />
                </svg>
              </HintIcon>
              <HintIcon label="Löschen" tone="delete" onClick={() => removeHint(row)}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16" />
                  <path d="M9 7V5h6v2" />
                  <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </HintIcon>
            </>
          ) : (
            <HintIcon label="Fertig" tone="done" onClick={() => markDone(row)}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5 9.5 17 19 7" />
              </svg>
            </HintIcon>
          )}
        </div>
      </div>
    </li>
  );

  return (
    <section className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Hinweise</h1>
          <PeriodFilter year={year} onYear={setYear} />
        </div>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-stone-600">
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-200" /> Aktuell
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-rose-200" /> Überfällig
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-200" /> Geplant
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-stone-300" /> Erledigt
          </li>
        </ul>
      </div>
      {error && <p className="text-red-700">{error}</p>}

      {rows.length === 0 ? (
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-stone-600">Kein Hinweis in diesem Zeitraum.</p>
          <p className="mt-3 text-sm text-stone-500">Ideen: Hefte im Juli, Schulbücher im April, Sommerreifen, Stromabrechnung.</p>
        </article>
      ) : (
        <>
          {activeRows.length > 0 && (
            <ul className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeRows.map(hintCard)}
            </ul>
          )}
          {archivedRows.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-stone-500">Archiv</h2>
              <ul className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
                {archivedRows.map(hintCard)}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
