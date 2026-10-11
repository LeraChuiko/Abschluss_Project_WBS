import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.ts';
import { useFrei } from '../FreiContext.tsx';
import { currentMonthKey, euro, monthName, monthsInRange, shiftMonth } from '../lib/format.ts';
import type { Dashboard, Debt, SavingsGoal, Transaction } from '../types.ts';

type HintKind = 'Saison' | 'Budget' | 'Sparziel' | 'Raten';

type Hint = {
  id: string;
  kind: HintKind;
  when: string;
  title: string;
  text: string;
};

const kindClass: Record<HintKind, string> = {
  Saison: 'bg-amber-100 text-amber-900',
  Budget: 'bg-violet-100 text-violet-900',
  Sparziel: 'bg-emerald-100 text-emerald-900',
  Raten: 'bg-fuchsia-100 text-fuchsia-900',
};

const seasonByMonth: Record<string, Array<{ title: string; text: string }>> = {
  '01': [
    {
      title: 'Belege für die Steuer',
      text: 'Januar ist gut, um Rechnungen und Spendenbelege zu sammeln — bevor sie in der Schublade verschwinden.',
    },
  ],
  '02': [
    {
      title: 'Heizung prüfen',
      text: 'Februar ist oft der teuerste Heizmonat. Schau, ob die Strom- und Gaszeile noch zur Realität passt.',
    },
  ],
  '03': [
    {
      title: 'Sommerreifen',
      text: 'Ab März/April kommen Sommerreifen. Plane Montage und lager die Winterreifen, bevor der Termin voll ist.',
    },
  ],
  '04': [
    {
      title: 'Ostern und Ausflüge',
      text: 'Kurzurlaub und Geschenke kommen extra. Lege den Betrag als Variable an, dann bleibt der Rest ehrlich.',
    },
  ],
  '05': [
    {
      title: 'Versicherungen',
      text: 'Viele Jahresbeiträge landen im Frühling. Prüfe, ob Haftpflicht und Hausrat noch zu deinem Leben passen.',
    },
  ],
  '06': [
    {
      title: 'Urlaub buchen',
      text: 'Sommerpreise steigen. Wenn Urlaub ein Sparziel ist — jetzt einzahlen, nicht im Juli improvisieren.',
    },
  ],
  '07': [
    {
      title: 'Sommerloch im Kalender, nicht im Konto',
      text: 'Eis, Bahn, Ausflüge: kleine Variable addiert sich. Ein Tageslimit hält Frei sichtbar.',
    },
  ],
  '08': [
    {
      title: 'Schulstart / September vorbereiten',
      text: 'Material, Tickets, neue Abos. Besser jetzt eine Zeile anlegen als im September überrascht zu sein.',
    },
  ],
  '09': [
    {
      title: 'Heizperiode startet',
      text: 'Ab September wird es wieder kalt. Winterdienst, Öl, Strom — schau die Pflicht-Zeilen an.',
    },
  ],
  '10': [
    {
      title: 'Winterreifen',
      text: 'In Deutschland gilt: bei Glätte Winterreifen. Oktober ist der ruhige Monat für Wechsel, bevor der erste Frost kommt.',
    },
  ],
  '11': [
    {
      title: 'Weihnachten vorbereiten',
      text: 'November ist der letzte ruhige Monat. Geschenke und Fahrten lieber als Variable einplanen — nicht aus Frei stehlen.',
    },
  ],
  '12': [
    {
      title: 'Weihnachten und Silvester',
      text: 'Dezember hat Extra-Ausgaben. Rest und Frei vorher anschauen, dann feierst du ohne Minus-Überraschung.',
    },
  ],
};

function seasonHints(month: string): Array<Hint> {
  const key = month.slice(5, 7);
  const when = monthName(month);
  return (seasonByMonth[key] ?? []).map((item, index) => ({
    id: `saison-${month}-${index}`,
    kind: 'Saison',
    when,
    title: item.title,
    text: item.text,
  }));
}

function remainingDebtMonths(debt: Debt, now: string): number {
  const last = shiftMonth(debt.startMonth, Math.max(0, debt.months - 1));
  if (last < now) {
    return 0;
  }
  const from = debt.startMonth > now ? debt.startMonth : now;
  return monthsInRange(from, last).length;
}

export function ForecastPage() {
  const { frei } = useFrei();
  const month = currentMonthKey();
  const next = shiftMonth(month, 1);
  const later = shiftMonth(month, 2);
  const [error, setError] = useState('');
  const [nowDash, setNowDash] = useState<Dashboard | null>(null);
  const [nextDash, setNextDash] = useState<Dashboard | null>(null);
  const [expenses, setExpenses] = useState<Array<Transaction>>([]);
  const [debts, setDebts] = useState<Array<Debt>>([]);
  const [goals, setGoals] = useState<Array<SavingsGoal>>([]);

  useEffect(() => {
    Promise.all([
      api.dashboard(month) as Promise<Dashboard>,
      api.dashboard(next) as Promise<Dashboard>,
      api.transactions(month) as Promise<Array<Transaction>>,
      api.debts() as Promise<Array<Debt>>,
      api.savingsGoals() as Promise<Array<SavingsGoal>>,
    ])
      .then(([dash, dashNext, list, debtList, goalList]) => {
        setNowDash(dash);
        setNextDash(dashNext);
        setExpenses(list.filter((item) => item.type === 'expense'));
        setDebts(debtList);
        setGoals(goalList);
      })
      .catch((err: Error) => setError(err.message));
  }, [month, next]);

  const hints = useMemo(() => {
    const rows: Array<Hint> = [
      ...seasonHints(month),
      ...seasonHints(next),
      ...seasonHints(later),
    ];

    if (frei < 0) {
      rows.push({
        id: 'budget-frei',
        kind: 'Budget',
        when: 'Bis Jahresende',
        title: 'Freie Mittel im Minus',
        text: `Frei steht bei ${euro(frei)}. Schau Variabel und Raten an, bevor du eine neue Ausgabe setzt.`,
      });
    } else if (frei > 0) {
      rows.push({
        id: 'budget-frei-ok',
        kind: 'Budget',
        when: 'Bis Jahresende',
        title: 'Es bleibt Luft',
        text: `${euro(frei)} sind frei bis Dezember. Gut für Sparziele — nicht für stille Abos.`,
      });
    }

    if (nowDash && nowDash.balance < 0) {
      rows.push({
        id: 'budget-month',
        kind: 'Budget',
        when: monthName(month),
        title: 'Dieser Monat ist eng',
        text: `Rest in ${monthName(month)}: ${euro(nowDash.balance)}. Einnahmen ${euro(nowDash.incomeTotal)}, Ausgaben ${euro(nowDash.expenseTotal)}.`,
      });
    }

    if (nextDash && nextDash.expenseTotal > 0 && nextDash.balance < 0) {
      rows.push({
        id: 'budget-next',
        kind: 'Budget',
        when: monthName(next),
        title: `${monthName(next)} wird negativ`,
        text: `Die geplanten Ausgaben (${euro(nextDash.expenseTotal)}) sind höher als die Einnahmen. Raten und Pflicht zuerst anfassen.`,
      });
    }

    const variable = expenses.filter((item) => item.expenseBlock === 'variable' && item.amount > 0);
    const variableSum = variable.reduce((sum, item) => sum + item.amount, 0);
    if (nowDash && nowDash.incomeTotal > 0 && variableSum > nowDash.incomeTotal * 0.35) {
      rows.push({
        id: 'budget-variable',
        kind: 'Budget',
        when: monthName(month),
        title: 'Viel Variabel',
        text: `${euro(variableSum)} in der grünen Tabelle — mehr als ein Drittel der Einnahmen. Das frisst Frei am schnellsten.`,
      });
    }

    for (const goal of goals) {
      const rest = Math.max(0, Number((goal.targetAmount - goal.currentAmount).toFixed(2)));
      if (rest <= 0) {
        rows.push({
          id: `goal-done-${goal._id}`,
          kind: 'Sparziel',
          when: 'Geschlossen',
          title: `${goal.title} ist da`,
          text: `${euro(goal.targetAmount)} sind beisammen. Die Karte auf Sparziele zeigt das Grün — du musst nichts mehr einzahlen.`,
        });
      } else {
        rows.push({
          id: `goal-open-${goal._id}`,
          kind: 'Sparziel',
          when: 'Offen',
          title: `Noch ${euro(rest)} für ${goal.title}`,
          text:
            frei > 0
              ? `Aus Frei (${euro(frei)}) kannst du einen Teil nach Sparziele schieben. Der Betrag landet in Variabel.`
              : `Frei ist knapp. Erst den Monat stabilisieren, dann wieder einzahlen.`,
        });
      }
    }

    for (const debt of debts) {
      const left = remainingDebtMonths(debt, month);
      if (left <= 0) {
        continue;
      }
      rows.push({
        id: `raten-${debt._id}`,
        kind: 'Raten',
        when: `${left} Monate`,
        title: `${debt.title} läuft noch`,
        text: `Noch ${left} Raten à ${euro(debt.monthlyPayment)}. Das sitzt in der pinken Tabelle und drückt Frei jeden Monat.`,
      });
    }

    return rows;
  }, [debts, expenses, frei, goals, later, month, next, nextDash, nowDash]);

  const nowName = monthName(month);
  const saisonNow = hints.filter((hint) => hint.kind === 'Saison' && hint.when === nowName);
  const saisonSoon = hints.filter((hint) => hint.kind === 'Saison' && hint.when !== nowName);
  const personal = hints.filter((hint) => hint.kind !== 'Saison');

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hinweise</h1>
        <p className="mt-2 text-stone-500">
          Keine Magie: Saison im Kalender plus Zahlen aus Budget, Raten und Sparzielen.
        </p>
      </div>
      {error && <p className="text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">Frei bis Jahresende</p>
          <p className={`text-xl font-bold tabular-nums ${frei < 0 ? 'text-red-700' : 'text-violet-800'}`}>
            {euro(frei)}
          </p>
        </article>
        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">Rest {monthName(month)}</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              (nowDash?.balance ?? 0) < 0 ? 'text-red-700' : 'text-stone-800'
            }`}
          >
            {nowDash ? euro(nowDash.balance) : '—'}
          </p>
        </article>
        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">Hinweise</p>
          <p className="text-xl font-bold tabular-nums">{hints.length}</p>
        </article>
      </div>

      {saisonNow.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Diesen Monat</h2>
          <ul className="grid gap-3">
            {saisonNow.map((hint) => (
              <HintCard key={hint.id} hint={hint} />
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Aus deinem Budget</h2>
        {personal.length === 0 ? (
          <p className="text-stone-500">Sobald Zahlen da sind, erscheinen Hinweise zu Frei, Raten und Zielen.</p>
        ) : (
          <ul className="grid gap-3">
            {personal.map((hint) => (
              <HintCard key={hint.id} hint={hint} />
            ))}
          </ul>
        )}
      </div>

      {saisonSoon.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Bald</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {saisonSoon.map((hint) => (
              <HintCard key={hint.id} hint={hint} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function HintCard({ hint }: { hint: Hint }) {
  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${kindClass[hint.kind]}`}>
          {hint.kind}
        </span>
        <span className="text-xs text-stone-400">{hint.when}</span>
      </div>
      <p className="font-semibold">{hint.title}</p>
      <p className="mt-1 text-sm text-stone-600">{hint.text}</p>
    </li>
  );
}
