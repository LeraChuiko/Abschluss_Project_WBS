import { useEffect, useState } from 'react';
import { currentMonthKey } from '../lib/format.ts';

const YEAR_KEY = 'finance-year';
const YEAR_EVENT = 'finance-year';

export function resetToCurrentYear(): void {
  const thisYear = currentMonthKey().slice(0, 4);
  localStorage.setItem(YEAR_KEY, thisYear);
  window.dispatchEvent(new CustomEvent(YEAR_EVENT, { detail: thisYear }));
}

export function useCalendarPeriod() {
  const thisYear = currentMonthKey().slice(0, 4);
  const [year, setYearState] = useState(() => localStorage.getItem(YEAR_KEY) || thisYear);
  const setYear = (value: string) => {
    localStorage.setItem(YEAR_KEY, value);
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

export function PeriodFilter({ year, onYear }: { year: string; onYear: (value: string) => void }) {
  const thisYear = currentMonthKey().slice(0, 4);
  const selected = Number(year);
  const years = [selected - 1, selected, selected + 1];

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-stone-300 text-sm shadow-sm">
      {years.map((value, index) => {
        const text = String(value);
        const active = year === text;
        const current = text === thisYear;
        const className = [
          'min-w-[5.5rem] px-4 py-2.5 tabular-nums',
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
  );
}
