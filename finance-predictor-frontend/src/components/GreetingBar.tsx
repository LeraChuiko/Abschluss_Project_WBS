import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.ts';
import { useAuth } from '../AuthContext.tsx';
import { goalImageFallback, toImageSrc } from '../lib/format.ts';
import type { SavingsGoal } from '../types.ts';

export function GreetingBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<SavingsGoal | null>(null);

  const loadGoal = () => {
    api
      .savingsGoals()
      .then((json) => {
        const open = (json as SavingsGoal[])
          .filter((item) => !item.archived && item.currentAmount < item.targetAmount)
          .sort((a, b) => {
            const pa = a.targetAmount > 0 ? a.currentAmount / a.targetAmount : 0;
            const pb = b.targetAmount > 0 ? b.currentAmount / b.targetAmount : 0;
            return pb - pa;
          });
        setGoal(open[0] ?? null);
      })
      .catch(() => setGoal(null));
  };

  useEffect(() => {
    loadGoal();
    const onReload = () => loadGoal();
    window.addEventListener('finance-reload', onReload);
    return () => window.removeEventListener('finance-reload', onReload);
  }, []);

  const goalSrc = goal
    ? toImageSrc(goal.imageUrl || '') || goalImageFallback(goal.title)
    : '';

  return (
    <div className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 text-sm">
        <div className="flex min-w-0 items-center gap-3">
          {goal && (
            <button
              type="button"
              className="relative z-10 h-9 w-14 shrink-0 cursor-pointer overflow-hidden rounded-md bg-violet-200"
              title={`Zu Sparziele: ${goal.title}`}
              onClick={() => navigate('/sparziele')}
            >
              {goalSrc ? (
                <img
                  src={goalSrc}
                  alt=""
                  className="pointer-events-none h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-violet-800">
                  {goal.title.slice(0, 1).toUpperCase()}
                </span>
              )}
            </button>
          )}
          <p className="min-w-0 leading-snug text-stone-700">
            Hallo, Familie Chuiko. Euer Ziel ist nah
            {goal ? (
              <>
                : <span className="font-bold text-violet-700">{goal.title}</span>!
              </>
            ) : (
              '!'
            )}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 cursor-pointer rounded-full border border-stone-300 px-3 py-1.5 font-semibold text-stone-700 hover:bg-stone-100 active:bg-stone-200"
          onClick={logout}
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}
