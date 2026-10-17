import { useEffect, useState } from 'react';
import { currentMonthKey } from '../lib/format.ts';

const YEAR_KEY = 'finance-year';
const YEAR_EVENT = 'finance-year';

export function resetToCurrentYear(): void {
  const thisYear = currentMonthKey().slice(0, 4);
  localStorage.setItem(YEAR_KEY, thisYear);
  localStorage.removeItem('finance-start');
  localStorage.removeItem('finance-end');
  window.dispatchEvent(new CustomEvent(YEAR_EVENT, { detail: thisYear }));
}

export function useCalendarPeriod() {
  const thisYear = currentMonthKey().slice(0, 4);
  const [year, setYearState] = useState(() => localStorage.getItem(YEAR_KEY) || thisYear);
  const setYear = (value: string) => {
    localStorage.setItem(YEAR_KEY, value);
    localStorage.removeItem('finance-start');
    localStorage.removeItem('finance-end');
    setYearState(value);
    window.dispatchEvent(new CustomEvent(YEAR_EVENT, { detail: value }));
  };

  useEffect(() => {
    const onYear = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (next && next !== year) {
        setYearState(next);
      }
    };
    window.addEventListener(YEAR_EVENT, onYear);
    return () => window.removeEventListener(YEAR_EVENT, onYear);
  }, [year]);

  return {
    year,
    setYear,
    start: `${year}-01`,
    end: `${year}-12`,
    thisYear,
  };
}

const MAX_YEAR = 2091;

export function PeriodFilter({ year, onYear }: { year: string; onYear: (value: string) => void }) {
  const thisYear = currentMonthKey().slice(0, 4);
  const minYear = Number(thisYear) - 1;
  const selected = Number(year);
  const years = [selected - 1, selected, selected + 1];
  const canPrev = selected > minYear;
  const canNext = selected < MAX_YEAR;

  const navClass = (enabled: boolean) =>
    [
      'min-w-[2.25rem] shrink-0 px-2 py-2.5 font-semibold',
      enabled ? 'cursor-pointer text-stone-700 hover:bg-stone-100' : 'cursor-default text-stone-300',
    ].join(' ');

  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-lg border border-stone-300 text-sm shadow-sm">
      <button
        type="button"
        className={navClass(canPrev)}
        aria-label="Frühere Jahre"
        disabled={!canPrev}
        onClick={() => onYear(String(selected - 1))}
      >
        ‹
      </button>
      {years.map((value) => {
        const text = String(value);
        const active = year === text;
        const current = text === thisYear;
        const className = [
          'min-w-[4.5rem] shrink-0 cursor-pointer border-l border-stone-300 px-3 py-2.5 tabular-nums',
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
            aria-label={current ? `Dieses Jahr ${text}` : Number(text) < Number(thisYear) ? `Vorjahr ${text}` : `Prognose ${text}`}
            className={className}
            onClick={() => onYear(text)}
          >
            {text}
          </button>
        );
      })}
      <button
        type="button"
        className={`${navClass(canNext)} border-l border-stone-300`}
        aria-label="Spätere Jahre"
        disabled={!canNext}
        onClick={() => onYear(String(selected + 1))}
      >
        ›
      </button>
    </div>
  );
}
