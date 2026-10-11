import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api.ts';
import { monthsOfCurrentYear } from './lib/format.ts';
import type { Dashboard } from './types.ts';

type FreiValue = {
  frei: number;
  reload: () => void;
};

const FreiContext = createContext<FreiValue>({ frei: 0, reload: () => {} });

export function FreiProvider({ children }: { children: ReactNode }) {
  const [frei, setFrei] = useState(0);

  const reload = () => {
    Promise.all(
      monthsOfCurrentYear().map((month) => api.dashboard(month) as Promise<Dashboard>),
    )
      .then((rows) => setFrei(rows.reduce((sum, row) => sum + row.balance, 0)))
      .catch(() => setFrei(0));
    window.dispatchEvent(new Event('finance-reload'));
  };

  useEffect(() => {
    reload();
  }, []);

  return <FreiContext.Provider value={{ frei, reload }}>{children}</FreiContext.Provider>;
}

export function useFrei() {
  return useContext(FreiContext);
}
