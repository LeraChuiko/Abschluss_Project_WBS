import { useState } from 'react';
import { api } from '../api.ts';
import { btnClass, euro } from '../lib/format.ts';
import type { AiForecast, AiRiskLevel } from '../types.ts';

const riskBadge: Record<AiRiskLevel, { label: string; className: string }> = {
  low: { label: 'Niedriges Risiko', className: 'bg-emerald-100 text-emerald-900' },
  medium: { label: 'Mittleres Risiko', className: 'bg-amber-100 text-amber-950' },
  high: { label: 'Hohes Risiko', className: 'bg-rose-100 text-rose-900' },
};

export function AiFinancialAdvisor() {
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forecast, setForecast] = useState<AiForecast | null>(null);

  const run = () => {
    setError('');
    setLoading(true);
    api
      .analyzeFinances(demo)
      .then((json) => setForecast(json as AiForecast))
      .catch((err: Error) => {
        setForecast(null);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  const badge = forecast ? riskBadge[forecast.riskLevel] : null;
  const restClass =
    forecast && forecast.projectedYearEndFreeFunds < 0 ? 'text-red-700' : 'text-violet-800';

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-violet-700 uppercase">
            Freie Mittel bis Jahresende
          </p>
          <h2 className="mt-1 text-lg font-bold text-stone-900">
            KI-Prognose: Freie Mittel bis Jahresende
          </h2>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            className={`${btnClass} inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70`}
            onClick={run}
            disabled={loading}
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            KI-Prognose berechnen
          </button>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-600">
            <input
              type="checkbox"
              checked={demo}
              onChange={(e) => setDemo(e.target.checked)}
            />
            Mit Beispieldaten testen
          </label>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {forecast && badge && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl bg-violet-700 px-4 py-4 text-white">
            <p className="text-xs font-medium tracking-wide text-violet-100 uppercase">
              Prognostizierte freie Mittel bis Jahresende
            </p>
            <p className={`mt-1 text-3xl font-bold tabular-nums ${forecast.projectedYearEndFreeFunds < 0 ? 'text-rose-100' : 'text-white'}`}>
              {euro(forecast.projectedYearEndFreeFunds)}
            </p>
            {forecast.usedDemoData && (
              <p className="mt-2 text-xs text-violet-200">Berechnet mit Beispieldaten.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
            <p className={`text-sm font-medium tabular-nums ${restClass}`}>{euro(forecast.projectedYearEndFreeFunds)}</p>
          </div>
          <p className="text-sm leading-relaxed text-stone-700">{forecast.summary}</p>
          <p className="text-sm text-stone-600">{forecast.riskExplanation}</p>
          <div>
            <p className="text-sm font-semibold text-stone-800">So steigt der Rest bis Dezember</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-stone-700">
              {forecast.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </article>
  );
}
