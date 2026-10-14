import { useEffect, useState } from 'react';
import { currentMonthKey, fieldClass } from '../lib/format.ts';

const YEAR_KEY = 'finance-year';
const START_KEY = 'finance-start';
const END_KEY = 'finance-end';
const YEAR_EVENT = 'finance-year';

type Period = { year: string; start: string; end: string };

const readPeriod = (): Period => {
  const thisYear = currentMonthKey().slice(0, 4);
  const year = localStorage.getItem(YEAR_KEY) || thisYear;
  const start = localStorage.getItem(START_KEY) || `${year}-01`;
  const end = localStorage.getItem(END_KEY) || `${year}-12`;
  return { year, start, end };
};

const writePeriod = (next: Period): void => {
  localStorage.setItem(YEAR_KEY, next.year);
  localStorage.setItem(START_KEY, next.start);
  localStorage.setItem(END_KEY, next.end);
  window.dispatchEvent(new CustomEvent(YEAR_EVENT, { detail: next }));
};

export function resetToCurrentYear(): void {
  const year = currentMonthKey().slice(0, 4);
  writePeriod({ year, start: `${year}-01`, end: `${year}-12` });
}

export function useCalendarPeriod() {
  const [{ year, start, end }, setPeriod] = useState(readPeriod);

  const apply = (next: Period) => {
    writePeriod(next);
    setPeriod(next);
  };

  const setYear = (value: string) => {
    apply({ year: value, start: `${value}-01`, end: `${value}-12` });
  };

  const setStart = (value: string) => {
    apply({ year, start: value, end: end < value ? value : end });
  };

  const setEnd = (value: string) => {
    apply({ year, start: start > value ? value : start, end: value });
  };

  useEffect(() => {
    const onYear = (event: Event) => {
      const next = (event as CustomEvent<Period>).detail;
      if (!next?.year) {
        return;
      }
      setPeriod(next);
    };
    window.addEventListener(YEAR_EVENT, onYear);
    return () => window.removeEventListener(YEAR_EVENT, onYear);
  }, []);

  const from = start <= end ? start : end;
  const to = start <= end ? end : start;

  return {
    year,
    setYear,
    start: from,
    end: to,
    setStart,
    setEnd,
    thisYear: currentMonthKey().slice(0, 4),
  };
}

export function PeriodFilter({
  year,
  onYear,
  start,
  end,
  onStart,
  onEnd,
}: {
  year: string;
  onYear: (value: string) => void;
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
}) {
  const thisYear = currentMonthKey().slice(0, 4);
  const selected = Number(year);
  const years = [selected - 1, selected, selected + 1];
  const min = `${year}-01`;
  const max = `${year}-12`;

  return (
    <div className="flex flex-col items-stretch gap-3 sm:items-end">
      <div className="inline-flex overflow-hidden rounded-lg border border-stone-300 text-sm shadow-sm">
        {years.map((value, index) => {
          const text = String(value);
          const active = year === text;
          const current = text === thisYear;
          const className = [
            'min-w-[5.5rem] cursor-pointer px-4 py-2.5 tabular-nums',
            index > 0 ? 'border-l border-stone-300' : '',
            active && current ? 'bg-emerald-600 font-bold text-white hover:bg-emerald-700' : '',
            !active && current ? 'bg-white font-bold text-emerald-700 hover:bg-emerald-50' : '',
            active && !current ? 'bg-violet-700 font-semibold text-white hover:bg-violet-800' : '',
            !active && !current ? 'bg-white text-stone-700 hover:bg-stone-100' : '',
          ].join(' ');
          return (
            <button
              key={text}
              type="button"
              aria-current={active ? 'page' : undefined}
              aria-label={index === 0 ? `Vorjahr ${text}` : index === 2 ? `Nächstes Jahr ${text}` : `Dieses Jahr ${text}`}
              className={className}
              onClick={() => onYear(text)}
            >
              {text}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
        <label className="flex items-center">
          Von
          <input
            className={`${fieldClass} period-month ml-2`}
            type="month"
            min={min}
            max={max}
            value={start}
            onChange={(e) => onStart(e.target.value)}
          />
        </label>
        <label className="flex items-center">
          Bis
          <input
            className={`${fieldClass} period-month ml-2`}
            type="month"
            min={min}
            max={max}
            value={end}
            onChange={(e) => onEnd(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
