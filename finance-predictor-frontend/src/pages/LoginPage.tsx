import { useState } from 'react';
import { useAuth } from '../AuthContext.tsx';
import { btnClass, fieldClass } from '../lib/format.ts';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f3ee] px-4">
      <article className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-violet-700 uppercase">
          Familien Finance Predictor
        </p>
        <h1 className="mt-1 text-2xl font-bold">
          {mode === 'login' ? 'Anmelden' : 'Registrieren'}
        </h1>
        <p className="mt-2 text-sm text-stone-500">Mit E-Mail und Passwort anmelden.</p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            const job =
              mode === 'login'
                ? login(email, password, remember)
                : register(email, password, name.trim() || 'Nutzer', remember);
            job.catch((err: Error) => setError(err.message));
          }}
        >
          {mode === 'register' && (
            <input
              className={`${fieldClass} w-full`}
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className={`${fieldClass} w-full`}
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={`${fieldClass} w-full`}
            type="password"
            minLength={6}
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Angemeldet bleiben (30 Tage)
          </label>
          <button className={`${btnClass} w-full`} type="submit">
            {mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>
        <button
          type="button"
          className="mt-4 cursor-pointer text-sm font-medium text-violet-700 hover:underline"
          onClick={() => {
            setError('');
            setMode(mode === 'login' ? 'register' : 'login');
          }}
        >
          {mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Schon ein Konto? Anmelden'}
        </button>
      </article>
    </div>
  );
}
