import { useState } from 'react';
import { api } from '../api.ts';
import { useFrei } from '../FreiContext.tsx';
import { btnClass, currentMonthKey, fieldClass, todayIsoDate, toImageSrc } from '../lib/format.ts';
import type { ExpenseBlock, IncomeGroup } from '../types.ts';
import { Modal } from './Modal.tsx';

type Kind = 'expense' | 'income' | 'debt' | 'savings' | null;

export function CreateModals({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const { reload } = useFrei();
  const [error, setError] = useState('');

  const done = () => {
    reload();
    onClose();
  };

  if (!kind) {
    return null;
  }

  return (
    <Modal
      title={
        kind === 'expense'
          ? 'Ausgabe'
          : kind === 'income'
            ? 'Einnahme'
            : kind === 'debt'
              ? 'Rate'
              : 'Sparziel'
      }
      onClose={onClose}
    >
      {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
      {kind === 'expense' && <ExpenseForm onError={setError} onDone={done} />}
      {kind === 'income' && <IncomeForm onError={setError} onDone={done} />}
      {kind === 'debt' && <DebtForm onError={setError} onDone={done} />}
      {kind === 'savings' && <SavingsForm onError={setError} onDone={done} />}
    </Modal>
  );
}

const monthShort = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function expenseMonths(
  start: string,
  mode: 'once' | 'every' | 'custom',
  every: number,
  custom: number[],
): string[] {
  const year = start.slice(0, 4);
  const startM = Number(start.slice(5, 7));
  if (mode === 'once') {
    return [start];
  }
  if (mode === 'custom') {
    const months = custom.length > 0 ? custom : [startM];
    return [...new Set(months)]
      .sort((a, b) => a - b)
      .map((m) => `${year}-${String(m).padStart(2, '0')}`);
  }
  const step = Math.min(12, Math.max(1, every));
  const list: string[] = [];
  for (let i = 0; i < 12; i += step) {
    const m = ((startM - 1 + i) % 12) + 1;
    list.push(`${year}-${String(m).padStart(2, '0')}`);
  }
  return [...new Set(list)].sort();
}

function ExpenseForm({
  onDone,
  onError,
}: {
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [block, setBlock] = useState<ExpenseBlock>('variable');
  const [mode, setMode] = useState<'once' | 'every' | 'custom'>('once');
  const [every, setEvery] = useState(3);
  const [custom, setCustom] = useState<number[]>([]);
  const [month, setMonth] = useState(todayIsoDate().slice(0, 7));
  const [importantDate, setImportantDate] = useState(false);
  const [date, setDate] = useState(todayIsoDate());
  const months = expenseMonths(month, mode, every, custom);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (months.length === 0) {
          onError('Bitte mindestens einen Monat wählen');
          return;
        }
        const seriesId = months.length > 1 ? crypto.randomUUID() : undefined;
        const payload = (dateValue: string, showDate: boolean) =>
          api.createTransaction({
            type: 'expense',
            title,
            amount: Number(amount),
            date: dateValue,
            expenseBlock: block,
            importantDate: showDate,
            ...(seriesId ? { seriesId } : {}),
          });

        const jobs = months.map((m) => {
          const isPicked = m === month;
          return payload(
            importantDate && isPicked ? date : `${m}-08`,
            Boolean(importantDate && isPicked),
          );
        });

        Promise.all(jobs)
          .then(onDone)
          .catch((err: Error) => onError(err.message));
      }}
    >
      <input className={`${fieldClass} w-full`} placeholder="Name" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input className={`${fieldClass} w-full`} type="number" min="0.01" step="0.01" placeholder="Betrag" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <select className={`${fieldClass} w-full`} value={block} onChange={(e) => setBlock(e.target.value as ExpenseBlock)}>
        <option value="fixed">Pflicht / Fix</option>
        <option value="variable">Variabel</option>
      </select>
      <select
        className={`${fieldClass} w-full`}
        value={mode}
        onChange={(e) => {
          const next = e.target.value as 'once' | 'every' | 'custom';
          setMode(next);
          if (next === 'custom' && custom.length === 0) {
            setCustom([Number(month.slice(5, 7))]);
          }
        }}
      >
        <option value="once">Einmal — nur dieser Monat</option>
        <option value="every">Regelmäßig — alle … Monate</option>
        <option value="custom">Eigene Monate in diesem Jahr</option>
      </select>
      {mode === 'every' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {[
              { n: 1, label: 'Monat' },
              { n: 3, label: 'Saison' },
              { n: 6, label: 'Halbjahr' },
              { n: 12, label: 'Jahr' },
            ].map((opt) => (
              <button
                key={opt.n}
                type="button"
                className={`rounded-full px-3 py-1 text-sm ${
                  every === opt.n ? 'bg-violet-700 text-white' : 'border border-stone-300 text-stone-700'
                }`}
                onClick={() => setEvery(opt.n)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <label className="block text-sm text-stone-600">
            Alle wie viele Monate?
            <input
              className={`${fieldClass} mt-1 w-full`}
              type="number"
              min={1}
              max={12}
              value={every}
              onChange={(e) => setEvery(Number(e.target.value) || 1)}
            />
          </label>
        </div>
      )}
      {mode === 'custom' && (
        <div className="grid grid-cols-4 gap-2">
          {monthShort.map((label, index) => {
            const value = index + 1;
            const checked = custom.includes(value);
            return (
              <label key={label} className="flex items-center gap-1.5 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setCustom((prev) =>
                      checked ? prev.filter((m) => m !== value) : [...prev, value],
                    );
                  }}
                />
                {label}
              </label>
            );
          })}
        </div>
      )}
      <p className="text-xs text-stone-500">
        {months.map((m) => monthShort[Number(m.slice(5, 7)) - 1]).join(', ')}
      </p>
      <label className="block text-sm text-stone-600">
        Startmonat
        <input className={`${fieldClass} mt-1 w-full`} type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={importantDate}
          onChange={(e) => setImportantDate(e.target.checked)}
        />
        Wichtiges Datum anzeigen
      </label>
      {importantDate && (
        <input className={`${fieldClass} w-full`} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      )}
      <div className="flex justify-end pt-1">
        <button className={btnClass} type="submit">
          Speichern
        </button>
      </div>
    </form>
  );
}

function IncomeForm({
  onDone,
  onError,
}: {
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [group, setGroup] = useState<IncomeGroup>('salary');
  const [spread, setSpread] = useState(true);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const seriesId = crypto.randomUUID();
        const payload = (dateValue: string) =>
          api.createTransaction({
            type: 'income',
            title,
            amount: Number(amount),
            date: dateValue,
            incomeGroup: group,
            seriesId,
          });
        const jobs = (() => {
          if (!spread) {
            return [payload(date)];
          }
          const startMonth = date.slice(0, 7);
          const year = startMonth.slice(0, 4);
          const current = currentMonthKey();
          const day = Number(date.slice(8, 10)) > 28 ? '01' : date.slice(8, 10);
          const yearMonths = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
          return yearMonths
            .filter((month) => month >= startMonth && (month === startMonth || month >= current))
            .map((month) => payload(`${month}-${day}`));
        })();

        Promise.all(jobs)
          .then(onDone)
          .catch((err: Error) => onError(err.message));
      }}
    >
      <input className={`${fieldClass} w-full`} placeholder="Name" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input className={`${fieldClass} w-full`} type="number" min="0.01" step="0.01" placeholder="Betrag" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <input className={`${fieldClass} w-full`} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <select className={`${fieldClass} w-full`} value={group} onChange={(e) => setGroup(e.target.value as IncomeGroup)}>
        <option value="salary">Gehalt / Job</option>
        <option value="business">Business</option>
        <option value="freelance">Freelance</option>
        <option value="gift">Geschenke / Wunder</option>
        <option value="investment">Investitionen</option>
      </select>
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={spread}
          onChange={(e) => setSpread(e.target.checked)}
        />
        Auf folgende Monate verteilen
      </label>
      <div className="flex justify-end pt-1">
        <button className={btnClass} type="submit">
          Speichern
        </button>
      </div>
    </form>
  );
}

function DebtForm({
  onDone,
  onError,
}: {
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [startMonth, setStartMonth] = useState(todayIsoDate().slice(0, 7));
  const [months, setMonths] = useState('6');

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const total = Number(totalAmount);
        const rate = Number(monthlyPayment);
        const count = Number(months);
        const product = Number((rate * count).toFixed(2));
        if (Number(total.toFixed(2)) !== product) {
          onError(`Gesamtsumme muss Rate × Monate sein: ${rate} × ${count} = ${product} €`);
          return;
        }
        api
          .createDebt({
            title,
            totalAmount: total,
            monthlyPayment: rate,
            startMonth,
            months: count,
          })
          .then(onDone)
          .catch((err: Error) => onError(err.message));
      }}
    >
      <input className={`${fieldClass} w-full`} placeholder="Name" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input className={`${fieldClass} w-full`} type="number" placeholder="Gesamtsumme" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
      <input className={`${fieldClass} w-full`} type="number" placeholder="Rate / Monat" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} required />
      <input className={`${fieldClass} w-full`} type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
      <input className={`${fieldClass} w-full`} type="number" min="1" placeholder="Monate" value={months} onChange={(e) => setMonths(e.target.value)} required />
      <div className="flex justify-end pt-1">
        <button className={btnClass} type="submit">
          Speichern
        </button>
      </div>
    </form>
  );
}

function SavingsForm({
  onDone,
  onError,
}: {
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        api
          .createSavingsGoal({
            title,
            targetAmount: Number(targetAmount),
            imageUrl: toImageSrc(imageUrl),
          })
          .then(onDone)
          .catch((err: Error) => onError(err.message));
      }}
    >
      <input className={`${fieldClass} w-full`} placeholder="Name" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input className={`${fieldClass} w-full`} type="number" min="0.01" step="0.01" placeholder="Zielsumme" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
      <input className={`${fieldClass} w-full`} placeholder="Foto-URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      <div className="flex justify-end pt-1">
        <button className={btnClass} type="submit">
          Speichern
        </button>
      </div>
    </form>
  );
}
