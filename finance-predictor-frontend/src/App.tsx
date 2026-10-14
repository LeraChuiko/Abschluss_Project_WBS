import { useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.tsx';
import { CreateModals } from './components/CreateModals.tsx';
import { resetToCurrentYear } from './components/PeriodFilter.tsx';
import { FreiProvider, useFrei } from './FreiContext.tsx';
import { euro } from './lib/format.ts';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { DebtsPage } from './pages/DebtsPage.tsx';
import { ForecastPage } from './pages/ForecastPage.tsx';
import { IncomesPage } from './pages/IncomesPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { SavingsPage } from './pages/SavingsPage.tsx';

const links = [
  { to: '/', label: 'Budget' },
  { to: '/einnahmen', label: 'Einnahmen' },
  { to: '/raten', label: 'Raten' },
  { to: '/sparziele', label: 'Sparziele' },
  { to: '/hinweise', label: 'Hinweise' },
];

function actionForPath(
  pathname: string,
): { kind: 'expense' | 'income' | 'debt' | 'savings' | 'hint'; label: string } | null {
  if (pathname === '/') {
    return { kind: 'expense', label: 'Ausgabe' };
  }
  if (pathname.startsWith('/einnahmen')) {
    return { kind: 'income', label: 'Einnahme' };
  }
  if (pathname.startsWith('/raten')) {
    return { kind: 'debt', label: 'Rate' };
  }
  if (pathname.startsWith('/sparziele')) {
    return { kind: 'savings', label: 'Sparziel' };
  }
  if (pathname.startsWith('/hinweise')) {
    return { kind: 'hint', label: 'Hinweis' };
  }
  return null;
}

function Shell() {
  const { pathname } = useLocation();
  const { frei } = useFrei();
  const { user, logout } = useAuth();
  const action = actionForPath(pathname);
  const [open, setOpen] = useState(false);
  const helloName = user?.name?.trim() || user?.email?.split('@')[0] || 'Valeriia';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#f6f3ee]/95 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-2.5 text-sm sm:px-6">
          <p className="text-stone-700">
            Hallo {helloName}. Du bist nah an deinem Ziel.
          </p>
          <button
            type="button"
            className="shrink-0 rounded-full border border-stone-300 px-3 py-1.5 font-semibold text-stone-700 hover:bg-stone-100"
            onClick={logout}
          >
            Abmelden
          </button>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="block leading-tight" onClick={resetToCurrentYear}>
              <p className="text-xs font-semibold tracking-wide text-violet-700 uppercase">
                Familien Finance
              </p>
              <p className="text-lg font-bold">Predictor</p>
            </Link>
            <nav className="flex flex-wrap gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1.5 text-sm ${
                      isActive
                        ? 'bg-violet-700 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-violet-700 px-4 py-3 text-white">
            <div>
              <p className="text-xs text-violet-100">Freie Mittel bis Jahresende</p>
              <p className="text-2xl font-bold tabular-nums">{euro(frei)}</p>
            </div>
            {action && (
              <button
                type="button"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-violet-800"
                onClick={() => setOpen(true)}
              >
                + {action.label}
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/einnahmen" element={<IncomesPage />} />
          <Route path="/raten" element={<DebtsPage />} />
          <Route path="/sparziele" element={<SavingsPage />} />
          <Route path="/hinweise" element={<ForecastPage />} />
          <Route path="/prognose" element={<Navigate to="/hinweise" replace />} />
        </Routes>
      </main>
      <CreateModals
        kind={open && action ? action.kind : null}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

function Gate() {
  const { user, ready } = useAuth();
  if (!ready) {
    return <p className="p-8 text-stone-500">Laden…</p>;
  }
  if (!user) {
    return <LoginPage />;
  }
  return (
    <FreiProvider>
      <Shell />
    </FreiProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

export default App;
