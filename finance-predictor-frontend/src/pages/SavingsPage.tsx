import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import { useFrei } from '../FreiContext.tsx';
import { btnClass, euro, fieldClass, todayIsoDate, toImageSrc } from '../lib/format.ts';
import type { SavingsGoal } from '../types.ts';

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
  const [items, setItems] = useState<Array<SavingsGoal>>([]);
  const [error, setError] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const load = () => {
    api
      .savingsGoals()
      .then((json) => setItems(json as Array<SavingsGoal>))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    const onReload = () => load();
    window.addEventListener('finance-reload', onReload);
    return () => window.removeEventListener('finance-reload', onReload);
  }, []);

  const deposit = (id: string) => {
    const amount = Number(amounts[id]);
    if (!amount || amount <= 0) {
      return;
    }
    api
      .depositSavingsGoal(id, { amount, date: todayIsoDate() })
      .then(() => {
        setAmounts((prev) => ({ ...prev, [id]: '' }));
        load();
        reload();
      })
      .catch((err: Error) => setError(err.message));
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Sparziele</h1>
      {error && <p className="text-red-700">{error}</p>}

      {items.length === 0 ? (
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-stone-600">Noch kein Sparziel. Lege oben rechts ein neues an.</p>
        </article>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {[...items]
            .sort((a, b) => {
              const aOpen = a.currentAmount < a.targetAmount ? 0 : 1;
              const bOpen = b.currentAmount < b.targetAmount ? 0 : 1;
              return aOpen - bOpen;
            })
            .map((g) => {
            const remaining = Math.max(0, Number((g.targetAmount - g.currentAmount).toFixed(2)));
            const percent =
              g.targetAmount > 0
                ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
                : 0;
            return (
              <article key={g._id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <GoalPhoto title={g.title} imageUrl={g.imageUrl} />
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
                  {remaining > 0 ? (
                    <form
                      className="flex items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        deposit(g._id);
                      }}
                    >
                      <label className="min-w-0 flex-1 text-sm text-stone-600">
                        Einzahlen
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
